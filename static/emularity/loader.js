/**  The Emularity; easily embed emulators
  *  Copyright © 2014-2016 Daniel Brooks <db48x@db48x.net>, Jason
  *  Scott <jscott@archive.org>, Grant Galitz <grantgalitz@gmail.com>,
  *  John Vilk <jvilk@cs.umass.edu>, and Tracey Jaquith <tracey@archive.org>
  *
  *  This program is free software: you can redistribute it and/or modify
  *  it under the terms of the GNU General Public License as published by
  *  the Free Software Foundation, either version 3 of the License, or
  *  (at your option) any later version.
  *
  *  This program is distributed in the hope that it will be useful,
  *  but WITHOUT ANY WARRANTY; without even the implied warranty of
  *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  *  GNU General Public License for more details.
  *
  *  You should have received a copy of the GNU General Public License
  *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
  */

var Module = null;

(function (Promise) {
   /**
    * IALoader
    */
   function IALoader(canvas, game, callbacks, scale) {
     // IA actually gives us an object here, and we really ought to be
     // looking things up from it instead.
     if (typeof game !== 'string') {
       game = game.toString();
     }
     if (!callbacks || typeof callbacks !== 'object') {
       callbacks = { before_emulator: updateLogo,
                     before_run: callbacks };
     } else {
       if (typeof callbacks.before_emulator === 'function') {
         var func = callbacks.before_emulator;
         callbacks.before_emulator = function () {
                                       updateLogo();
                                       func();
                                     };
       } else {
         callbacks.before_emulator = updateLogo;
       }
     }

     function img(src) {
       var img = new Image();
       img.src = src;
       return img;
     }

     // yea, this is a hack
     var images;
     if (/archive\.org$/.test(document.location.hostname)) {
       images = { ia: img("/images/ialogo.png"),
                  mame: img("/images/mame.png"),
                  mess: img("/images/mame.png"),
                  dosbox: img("/images/dosbox.png"),
                  sae: img("/images/sae.png"),
                  pce: img("/images/pce.png"),
                  vice: img("/images/vice.svg")
                };
     } else {
       images = { ia: img("other_logos/ia-logo-150x150.png"),
                  mame: img("other_logos/mame.png"),
                  mess: img("other_logos/mame.png"),
                  dosbox: img("other_logos/dosbox.png"),
                  sae: img("other_logos/sae.png"),
                  pce: img("other_logos/pce.png"),
                  vice: img("other_logos/vice.svg")
                };
     }

     function updateLogo() {
       if (emulator_logo) {
         emulator.setSplashImage(emulator_logo);
       }
     }

     var SAMPLE_RATE = (function () {
                          var audio_ctx = window.AudioContext || window.webkitAudioContext || false;
                          if (!audio_ctx) {
                            return false;
                          }
                          var sample = new audio_ctx;
                          return sample.sampleRate.toString();
                        }());

     var metadata, filelist, module, modulecfg, config_args, emulator_logo,
         emulator = new Emulator(canvas).setScale(scale)
                                        .setSplashImage(images.ia)
                                        .setLoad(loadFiles)
                                        .setCallbacks(callbacks);

     var cfgr;
     function loadFiles(fetch_file, splash) {
       splash.setTitle("Downloading game metadata...");
       return new Promise(function (resolve, reject) {
                            var loading = fetch_file('Game Metadata',
                                                     get_meta_url(game),
                                                     'document');
                            loading.then(function (data) {
                                           metadata = data;
                                           splash.setTitle("Downloading game filelist...");
                                           return fetch_file('Game File List',
                                                             get_files_url(game),
                                                             'document', true);
                                         },
                                         function () {
                                           splash.setTitle("Failed to download IA item metadata!");
                                           splash.failed_loading = true;
                                           reject(1);
                                         })
                                   .then(function (data) {
                                           if (splash.failed_loading) {
                                             return null;
                                           }
                                           filelist = data;
                                           splash.setTitle("Downloading emulator metadata...");
                                           module = metadata.getElementsByTagName("emulator")
                                                            .item(0)
                                                            .textContent;
                                           return fetch_file('Emulator Metadata',
                                                             get_emulator_config_url(module),
                                                             'text', true);
                                         },
                                         function () {
                                           if (splash.failed_loading) {
                                             return;
                                           }
                                           splash.setTitle("Failed to download file list!");
                                           splash.failed_loading = true;
                                           reject(2);
                                         })
                                   .then(function (data) {
                                           if (splash.failed_loading) {
                                             return null;
                                           }

                                           modulecfg = JSON.parse(data);
                                           var get_files;

                                           if (module && module.indexOf("dosbox") === 0) {
                                             emulator_logo = images.dosbox;
                                             cfgr = DosBoxLoader;
                                             get_files = get_dosbox_files;
                                           }
                                           else if (module && module.indexOf("sae-") === 0) {
                                             emulator_logo = images.sae;
                                             cfgr = SAELoader;
                                             get_files = get_sae_files;
                                           }
                                           else if (module && module.indexOf("pce-") === 0) {
                                             emulator_logo = images.pce;
                                             cfgr = PCELoader;
                                             get_files = get_pce_files;
                                           }
                                           else if (module && module.indexOf("vice") === 0) {
                                             emulator_logo = images.vice;
                                             cfgr = VICELoader;
                                             get_files = get_vice_files;
                                           }
                                           else if (module) {
                                             emulator_logo = images.mame;
                                             cfgr = MAMELoader;
                                             get_files = get_mame_files;
                                           }
                                           else {
                                             throw new Error("Unknown module type "+ module +"; cannot configure the emulator.");
                                           }

                                           var wantsWASM = modulecfg.wasm_filename && 'WebAssembly' in window;
                                           var nr = modulecfg['native_resolution'];
                                           config_args = [cfgr.emulatorJS(get_js_url(wantsWASM ? modulecfg.wasmjs_filename : modulecfg.js_filename)),
                                                          cfgr.emulatorWASM(wantsWASM && get_js_url(modulecfg.wasm_filename)),
                                                          cfgr.locateAdditionalEmulatorJS(locateAdditionalJS),
                                                          cfgr.fileSystemKey(game),
                                                          cfgr.nativeResolution(nr[0], nr[1]),
                                                          cfgr.aspectRatio(nr[0] / nr[1]),
                                                          cfgr.sampleRate(SAMPLE_RATE)];

                                           if ('keepAspect' in cfgr) {
                                             cfgr.keepAspect(modulecfg.keepAspect);
                                           }

                                           if (/archive\.org$/.test(document.location.hostname)) {
                                             cfgr.muted(!(typeof $ !== 'undefined' && $.cookie && $.cookie('unmute')));
                                           }

                                           if (module && module.indexOf("dosbox") === 0) {
                                             config_args.push(cfgr.startExe(metadata.getElementsByTagName("emulator_start")
                                                                                    .item(0)
                                                                                    .textContent));
                                           } else if (module && module.indexOf("vice") === 0) {
                                             let emulator_start_item = metadata.getElementsByTagName("emulator_start").item(0);
                                             if (emulator_start_item) {
                                               config_args.push(cfgr.autoLoad(emulator_start_item.textContent));
                                             }
                                             config_args.push(cfgr.extraArgs(modulecfg.extra_args));
                                           } else if (module && module.indexOf("sae-") === 0) {
                                             config_args.push(cfgr.model(modulecfg.driver),
                                                              cfgr.rom(modulecfg.bios_filenames));
                                           } else if (module && module.indexOf("pce-") === 0) {
                                             config_args.push(cfgr.model(modulecfg.driver));
                                           } else if (module) { // MAME
                                             config_args.push(cfgr.driver(modulecfg.driver),
                                                              cfgr.extraArgs(modulecfg.extra_args));
                                           }

                                           splash.setTitle("Downloading game data...");
                                           return Promise.all(get_files(cfgr, metadata, modulecfg, filelist));
                                         },
                                         function () {
                                           if (splash.failed_loading) {
                                             return;
                                           }
                                           splash.setTitle("Failed to download emulator metadata!");
                                           splash.failed_loading = true;
                                           reject(2);
                                         })
                                   .then(function (game_files) {
                                           if (splash.failed_loading) {
                                             return;
                                           }
                                           updateLogo();
                                           resolve(cfgr.apply(null, extend(config_args, game_files)));
                                         },
                                         function (e) {
                                           if (splash.failed_loading) {
                                             return;
                                           }
                                           splash.setTitle("Failed to configure emulator!");
                                           splash.failed_loading = true;
                                           reject(3);
                                         });
                          });
     }

     function locateAdditionalJS(filename) {
       if ("file_locations" in modulecfg && filename in modulecfg.file_locations) {
         return get_js_url(modulecfg.file_locations[filename]);
       }
       return get_js_url(filename);
     }

     function get_dosbox_files(cfgr, metadata, modulecfg, filelist) {
       var default_drive = "c", // pick any drive letter as a default
           drives = {}, files = [],
           meta = dict_from_xml(metadata);
       if (game && game.endsWith(".zip")) {
         drives[default_drive] = game;
       }
       files_with_ext_from_filelist(filelist, meta.emulator_ext).forEach(function (file, i) {
                                                                           drives[default_drive] = file.name;
                                                                         });
       meta_props_matching(meta, /^dosbox_drive_([a-zA-Z])$/).forEach(function (result) {
                                                                        let key = result[0], match = result[1];
                                                                        drives[match[1]] = meta[key];
                                                                      });
       var mounts = Object.keys(drives),
           len = mounts.length;
       mounts.forEach(function (drive, i) {
                        var title = "Game File ("+ (i+1) +" of "+ len +")",
                            filename = drives[drive],
                            url = (filename.includes("/")) ? get_zip_url(filename)
                                                           : get_zip_url(filename, get_item_name(game));
                            if (filename.toLowerCase().endsWith(".zip")) {
                              files.push(cfgr.mountZip(drive,
                                                       cfgr.fetchFile(title, url)));
                            } else {
                              files.push(cfgr.mountFile('/'+ filename,
                                                        cfgr.fetchFile(title, url)));
                            }
                      });
       return files;
     }
     
     function get_vice_files(cfgr, metadata, modulecfg, filelist) {
       var default_drive = "8", 
           drives = {}, files = [], wanted_files = []
           meta = dict_from_xml(metadata);
       files_with_ext_from_filelist(filelist, meta.emulator_ext).forEach(function (file, i) {
                                                                           //drives[default_drive] = file.name;
                                                                           wanted_files.push(file.name);
                                                                         });
       meta_props_matching(meta, /^vice_drive_([89])$/).forEach(function (result) {
                                                                        let key = result[0], match = result[1];
                                                                        drives[match[1]] = meta[key];
                                                                      });
       var len = wanted_files.length;
       wanted_files.forEach(function (file, i) {
                        var title = "Game File ("+ (i+1) +" of "+ len +")",
                            filename = file,
                            url = (filename.includes("/")) ? get_zip_url(filename)
                                                           : get_zip_url(filename, get_item_name(game));
                            console.log("Retrieving URL",url);
                            if (filename.toLowerCase().endsWith(".zip")&&false) { // TODO: Enable and fix zip support.
                              files.push(cfgr.mountZip("", // TODO: This is a hack, no drive actually applicable here
                                                       cfgr.fetchFile(title, url)));
                            } else {
                             //TODO: ensure vice_drive_8 and vice_drive_9 actually function.
                              files.push(cfgr.mountFile('/'+ filename,
                                                        cfgr.fetchFile(title, url)));
                            }
                      });
       return files;
     }

     function get_mame_files(cfgr, metadata, modulecfg, filelist) {
       var files = [],
           bios_files = modulecfg['bios_filenames'];
       bios_files.forEach(function (fname, i) {
                            if (fname) {
                              var title = "Bios File ("+ (i+1) +" of "+ bios_files.length +")";
                              files.push(cfgr.mountFile('/'+ fname,
                                                        cfgr.fetchFile(title,
                                                                       get_bios_url(fname))));
                            }
                          });

       var meta = dict_from_xml(metadata),
           peripherals = {},
           game_files_counter = {};
       files_with_ext_from_filelist(filelist, meta.emulator_ext).forEach(function (file, i) {
                                                                           game_files_counter[file.name] = 1;
                                                                           if (modulecfg.peripherals && modulecfg.peripherals[i]) {
                                                                             peripherals[modulecfg.peripherals[i]] = file.name;
                                                                           }
                                                                         });
       meta_props_matching(meta, /^mame_peripheral_([a-zA-Z0-9]+)$/).forEach(function (result) {
                                                                               let key = result[0], match = result[1];
                                                                               peripherals[match[1]] = meta[key];
                                                                               game_files_counter[meta[key]] = 1;
                                                                             });

       var game_files = Object.keys(game_files_counter),
           len = game_files.length;
       game_files.forEach(function (filename, i) {
                            var title = "Game File ("+ (i+1) +" of "+ len +")",
                                url = (filename.includes("/")) ? get_zip_url(filename)
                                                               : get_zip_url(filename, get_item_name(game));
                            files.push(cfgr.mountFile('/'+ filename,
                                                      cfgr.fetchFile(title, url)));
                          });
       Object.keys(peripherals).forEach(function (periph) {
                                          files.push(cfgr.peripheral(periph,                // we're not pushing a 'file' here,
                                                                     peripherals[periph])); // but that's ok
                                        });

       files.push(cfgr.mountFile('/'+ modulecfg['driver'] + '.cfg',
                                 cfgr.fetchOptionalFile("CFG File",
                                                        get_other_emulator_config_url(module))));
       return files;
     }

     function get_sae_files(cfgr, metadata, modulecfg, filelist) {
       var files = [],
           bios_files = modulecfg['bios_filenames'];
       bios_files.forEach(function (fname, i) {
                            if (fname) {
                              var title = "Bios File ("+ (i+1) +" of "+ bios_files.length +")";
                              files.push(cfgr.mountFile('/'+ fname,
                                                        cfgr.fetchFile(title,
                                                                       get_bios_url(fname))));
                            }
                          });

       var meta = dict_from_xml(metadata),
           game_files = files_with_ext_from_filelist(filelist, meta.emulator_ext);
       game_files.forEach(function (file, i) {
                            if (file) {
                              var title = "Game File ("+ (i+1) +" of "+ game_files.length +")",
                                  url = (file.name.includes("/")) ? get_zip_url(file.name)
                                                                  : get_zip_url(file.name, get_item_name(game));
                              files.push(cfgr.mountFile('/'+ file.name,
                                                        cfgr.fetchFile(title, url)));
                              files.push(cfgr.floppy(0,             // we're not pushing a file here
                                                     file.name));   // but that's ok
                            }
                          });
       files.push(cfgr.mountFile('/'+ modulecfg['driver'] + '.cfg',
                                 cfgr.fetchOptionalFile("Config File",
                                                        get_other_emulator_config_url(module))));
       return files;
     }

     function get_pce_files(cfgr, metadata, modulecfg, filelist) {
       var files = [],
           bios_files = modulecfg['bios_filenames'];
       bios_files.forEach(function (fname, i) {
                            if (fname) {
                              var title = "ROM File ("+ (i+1) +" of "+ bios_files.length +")";
                              files.push(cfgr.mountFile('/'+ fname,
                                                        cfgr.fetchFile(title,
                                                                       get_bios_url(fname))));
                            }
                          });

       var meta = dict_from_xml(metadata),
           game_files_counter = {};
       files_with_ext_from_filelist(filelist, meta.emulator_ext).forEach(function (file, i) {
                                                                           if (modulecfg.peripherals && modulecfg.peripherals[i]) {
                                                                             game_files_counter[file.name] = modulecfg.peripherals[i];
                                                                           }
                                                                         });
       meta_props_matching(meta, /^pce_drive_([a-zA-Z0-9]+)$/).forEach(function (result) {
                                                                         var key = result[0], periph = result[1][1];
                                                                         game_files_counter[meta[key]] = periph;
                                                                       });

       var game_files = Object.keys(game_files_counter),
           len = game_files.length;
       game_files.forEach(function (filename, i) {
                            var title = "Game File ("+ (i+1) +" of "+ len +")",
                                ext = filename.match(/\.([^.]*)$/)[1],
                                url = (filename.includes("/")) ? get_zip_url(filename)
                                                               : get_zip_url(filename, get_item_name(game));
                            files.push(cfgr.mountFile('/'+ game_files_counter[filename] +'.'+ ext,
                                                      cfgr.fetchFile(title, url)));
                          });

       files.push(cfgr.mountFile('/pce-'+ modulecfg['driver'] + '.cfg',
                                 cfgr.fetchOptionalFile("Config File",
                                                        get_other_emulator_config_url("pce-"+ modulecfg['driver']))));
       return files;
     }
     var get_item_name = function (game_path) {
       return game_path.split('/').shift();
     };

     var get_game_name = function (game_path) {
       return game_path.split('/').pop();
     };

     // NOTE: deliberately use cors.archive.org since this will 302 rewrite to iaXXXXX.us.archive.org/XX/items/...
     // and need to keep that "artificial" extra domain-ish name to avoid CORS issues with IE/Safari  (tracey@archive)
     var get_emulator_config_url = function (module) {
       return '//cors.archive.org/cors/emularity_engine_v1/' + module + '.json';
     };

     var get_other_emulator_config_url = function (module) {
       return '//cors.archive.org/cors/emularity_config_v1/' + module + '.cfg';
     };

     var get_meta_url = function (game_path) {
       var path = game_path.split('/');
       return "//cors.archive.org/cors/"+ path[0] +"/"+ path[0] +"_meta.xml";
     };

     var get_files_url = function (game_path) {
       var path = game_path.split('/');
       return "//cors.archive.org/cors/"+ path[0] +"/"+ path[0] +"_files.xml";
     };

     var get_zip_url = function (game_path, item_path) {
       if (item_path) {
         return "//cors.archive.org/cors/"+ item_path +"/"+ game_path;
       }
       return "//cors.archive.org/cors/"+ game_path;
     };

     var get_js_url = function (js_filename) {
       return "//cors.archive.org/cors/emularity_engine_v1/"+ js_filename;
     };

     var get_bios_url = function (bios_filename) {
       return "//cors.archive.org/cors/emularity_bios_v1/"+ bios_filename;
     };

     function mountat (drive) {
       return function (data) {
         return { drive: drive,
                  mountpoint: "/" + drive,
                  data: data
                };
       };
     }

     return emulator;
   }

   /**
    * BaseLoader
    */
   function BaseLoader() {
     return Array.prototype.reduce.call(arguments, extend);
   }

   BaseLoader.canvas = function (id) {
     var elem = id instanceof Element ? id : document.getElementById(id);
     return { canvas: elem };
   };

   BaseLoader.emulatorJS = function (url) {
     return { emulatorJS: url };
   };

   BaseLoader.emulatorWASM = function (url) {
     return { emulatorWASM: url };
   };

   BaseLoader.locateAdditionalEmulatorJS = function (func) {
     return { locateAdditionalJS: func };
   };

   BaseLoader.fileSystemKey = function (key) {
     return { fileSystemKey: key };
   };

   BaseLoader.nativeResolution = function (width, height) {
     if (typeof width !== 'number' || typeof height !== 'number')
       throw new Error("Width and height must be numbers");
     return { nativeResolution: { width: Math.floor(width), height: Math.floor(height) } };
   };

   BaseLoader.aspectRatio = function (ratio) {
     if (typeof ratio !== 'number')
       throw new Error("Aspect ratio must be a number");
     return { aspectRatio: ratio };
   };

   BaseLoader.sampleRate = function (rate) {
     return { sample_rate: rate };
   };

   BaseLoader.muted = function (muted) {
     return { muted: muted };
   };

   BaseLoader.mountZip = function (drive, file) {
     return { files: [{ drive: drive,
                        mountpoint: "/" + drive,
                        file: file
                      }] };
   };

   BaseLoader.mountFile = function (filename, file) {
     return { files: [{ mountpoint: filename,
                        file: file
                      }] };
   };

   BaseLoader.fetchFile = function (title, url) {
     return { title: title, url: url, optional: false };
   };

   BaseLoader.fetchOptionalFile = function (title, url) {
     return { title: title, url: url, optional: true };
   };

   BaseLoader.localFile = function (title, data) {
     return { title: title, data: data };
   };

   /**
    * DosBoxLoader
    */
   function DosBoxLoader() {
     var config = Array.prototype.reduce.call(arguments, extend);
     config.emulator_arguments = build_dosbox_arguments(config.emulatorStart, config.files, config.extra_dosbox_args);
     config.runner = EmscriptenRunner;
     return config;
   }
   DosBoxLoader.__proto__ = BaseLoader;

   DosBoxLoader.startExe = function (path) {
     return { emulatorStart: path };
   };

   DosBoxLoader.extraArgs = function (args) {
     return { extra_dosbox_args: args };
   };

   /**
    * MAMELoader
    */
   function MAMELoader() {
     var config = Array.prototype.reduce.call(arguments, extend);
     config.emulator_arguments = build_mame_arguments(config.muted, config.mame_driver,
                                                      config.nativeResolution, config.sample_rate,
                                                      config.peripheral, config.extra_mame_args,
                                                      config.keep_aspect);
     config.runner = MAMERunner;
     return config;
   }
   MAMELoader.__proto__ = BaseLoader;

   MAMELoader.driver = function (driver) {
     return { mame_driver: driver };
   };

   MAMELoader.peripheral = function (peripheral, game) {
     var p = {};
     p[peripheral] = [game];
     return { peripheral: p };
   };

   MAMELoader.keepAspect = function (keep) {
     return { keep_aspect: !!keep };
   };

   MAMELoader.extraArgs = function (args) {
     return { extra_mame_args: args };
   };
   
   /**
    * VICELoader
    */
    function VICELoader() {
      var config = Array.prototype.reduce.call(arguments, extend);
      config.emulator_arguments = build_vice_arguments(config.emulatorStart, config.files, config.extra_vice_args);
      config.runner = EmscriptenRunner;
      return config;
    }
    VICELoader.__proto__ = BaseLoader;
    
    VICELoader.autoLoad = function (path) {
     return { emulatorStart: path };
    };
    VICELoader.extraArgs = function (args) {
      return { extra_vice_args: args };
    }

   /**
    * SAELoader
    */

   function SAELoader() {
     var config = Array.prototype.reduce.call(arguments, extend);
     config.runner = SAERunner;
     return config;
   }
   SAELoader.__proto__ = BaseLoader;

   SAELoader.model = function (model) {
     return { amigaModel: model };
   };

   SAELoader.fastMemory = function (megabytes) {
     return { fast_memory: megabytes << 20 };
   };

   SAELoader.rom = function (filenames) {
     if (typeof filenames == "string")
       filenames = [filenames];
     return { rom: filenames[0], extRom: filenames[1] };
   };

   SAELoader.floppy = function (index, filename) {
     var f = {};
     f[index] = filename;
     return { floppy: f };
   };

   SAELoader.ntsc = function (v) {
     return { ntsc: !!v };
   };

   /**
    * PCELoader
    */

   function PCELoader() {
     var config = Array.prototype.reduce.call(arguments, extend);
     config.emulator_arguments = ["-c", "/emulator/pce-"+ config.pceModel +".cfg"];
     config.runner = EmscriptenRunner;
     return config;
   }
   PCELoader.__proto__ = BaseLoader;

   PCELoader.model = function (model) {
     return { pceModel: model };
   };

   var build_mame_arguments = function (muted, driver, native_resolution, sample_rate, peripheral, extra_args, keepaspect) {
     var args = [driver,
                 '-verbose',
                 '-rompath', 'emulator',
                 '-window',
                 keepaspect ? '-keepaspect' : '-nokeepaspect'];

     if (native_resolution && "width" in native_resolution && "height" in native_resolution) {
       args.push('-resolution', [native_resolution.width, native_resolution.height].join('x'));
     }

     if (muted) {
       args.push('-sound', 'none');
     } else if (sample_rate) {
       args.push('-samplerate', sample_rate);
     }

     if (peripheral) {
       for (var p in peripheral) {
         if (Object.prototype.propertyIsEnumerable.call(peripheral, p)) {
           args.push('-' + p,
                     '/emulator/'+ (peripheral[p][0].replace(/\//g,'_')));
         }
       }
     }

     if (extra_args) {
       args = args.concat(extra_args);
     }

     return args;
   };

   var build_dosbox_arguments = function (emulator_start, files, extra_args) {
     var args = ['-conf', '/emulator/dosbox.conf'];

     var len = files.length;
     for (var i = 0; i < len; i++) {
       if ('drive' in files[i]) {
         args.push('-c', 'mount '+ files[i].drive +' /emulator'+ files[i].mountpoint);
       }
     }

     if (extra_args) {
       args = args.concat(extra_args);
     }

     var path = emulator_start.split(/\\|\//); // I have LTS already
     args.push('-c', /^[a-zA-Z]:$/.test(path[0]) ? path.shift() : 'c:');
     var prog = path.pop();
     if (path && path.length)
       args.push('-c', 'cd '+ path.join('/'));
     args.push('-c', prog);

     return args;
   };
   
   var build_vice_arguments = function (emulator_start, files, extra_args) {
       var args = emulator_start ? ["-autostart", "/emulator/" + emulator_start] : [];
       if(extra_args) {
           args = args.concat(extra_args);
       }
       return args;
   }

   /*
    * EmscriptenRunner
    */
   function EmscriptenRunner(canvas, game_data) {
     var self = this;
     this._hooks = { start: [], reset: [] };
     // This is somewhat wrong, because our Emscripten-based emulators
     // are currently compiled to start immediately when their js file
     // is loaded.
     Module = { arguments: game_data.emulator_arguments,
                screenIsReadOnly: true,
                print: function (text) { console.log(text); },
                printErr: function (text) { console.log(text); },
                canvas: canvas,
                noInitialRun: false,
                locateFile: game_data.locateAdditionalJS,
                wasmBinary: game_data.wasmBinary,
                preInit: function () {
                           // Re-initialize BFS to just use the writable in-memory storage.
                           BrowserFS.initialize(game_data.fs);
                           var BFS = new BrowserFS.EmscriptenFS();
                           // Mount the file system into Emscripten.
                           FS.mkdir('/emulator');
                           FS.mount(BFS, {root: '/'}, '/emulator');
                         },
                preRun: [function () {
                            self._hooks.start.forEach(function (f) {
                                                        //try {
                                                          f && f();
                                                        //} catch(x) {
                                                        //  console.warn(x);
                                                        //}
                                                      });
                          }]
              };
   }

   EmscriptenRunner.prototype.start = function () {
   };

   EmscriptenRunner.prototype.pause = function () {
   };

   EmscriptenRunner.prototype.stop = function () {
   };

   EmscriptenRunner.prototype.mute = function () {
     try {
       if (!SDL_PauseAudio)
         SDL_PauseAudio = Module.cwrap('SDL_PauseAudio', '', ['number']);
       SDL_PauseAudio(true);
     } catch (x) {
       console.log("Unable to change audio state:", x);
     }
   };

   EmscriptenRunner.prototype.unmute = function () {
     try {
       if (!SDL_PauseAudio)
         SDL_PauseAudio = Module.cwrap('SDL_PauseAudio', '', ['number']);
       SDL_PauseAudio(false);
     } catch (x) {
       console.log("Unable to change audio state:", x);
     }
   };

   EmscriptenRunner.prototype.onStarted = function (func) {
     this._hooks.start.push(func);
   };

   EmscriptenRunner.prototype.onReset = function (func) {
     this._hooks.reset.push(func);
   };

   EmscriptenRunner.prototype.requestFullScreen = function () {
   };

   /*
    * MAMERunner
    */
   function MAMERunner() {
     return EmscriptenRunner.apply(this, arguments);
   }
   MAMERunner.prototype = Object.create(EmscriptenRunner.prototype,
                                        {
                                          mute: function () {
                                                  var soundmgr = Module.__ZN15running_machine20emscripten_get_soundEv(Module.__ZN15running_machine30emscripten_get_running_machineEv());
                                                  Module.__ZN13sound_manager4muteEbh(soundmgr,
                                                                                     true,
                                                                                     0x02); // MUTE_REASON_UI
                                                },
                                          unmute: function () {
                                                    var soundmgr = Module.__ZN15running_machine20emscripten_get_soundEv(Module.__ZN15running_machine30emscripten_get_running_machineEv());
                                                    Module.__ZN13sound_manager4muteEbh(soundmgr,
                                                                                       false,
                                                                                       0x02); // MUTE_REASON_UI
                                                  }
                                        });

   /*
    * SAERunner
    */
   function SAERunner(canvas, game_data) {
     this._sae = new ScriptedAmigaEmulator();
     this._cfg = this._sae.getConfig();
     this._canvas = canvas;

     var model = null;
     switch (game_data.amigaModel) {
       case "A500": model = SAEC_Model_A500; break;
       case "A500P": model = SAEC_Model_A500P; break;
       case "A600": model = SAEC_Model_A600; break;
       case "A1000": model = SAEC_Model_A1000; break;
       case "A1200": model = SAEC_Model_A1200; break;
       case "A2000": model = SAEC_Model_A2000; break;
       case "A3000": model = SAEC_Model_A3000; break;
       case "A4000": model = SAEC_Model_A4000; break;
       case "A4000T": model = SAEC_Model_A4000T; break;
       /*  future. do not use. cd-emulation is not implemented yet.
       case "CDTV": model = SAEC_Model_CDTV; break;
       case "CD32": model = SAEC_Model_CD32; break; */
     }
     this._sae.setModel(model, 0);
     this._cfg.memory.z2FastSize = game_data.fastMemory || 2 << 20;
     this._cfg.floppy.speed = SAEC_Config_Floppy_Speed_Turbo;
     this._cfg.video.id = canvas.getAttribute("id");

     if (game_data.nativeResolution && game_data.nativeResolution.height == 360 && game_data.nativeResolution.width == 284)
     {
       this._cfg.video.hresolution = SAEC_Config_Video_HResolution_LoRes;
       this._cfg.video.vresolution = SAEC_Config_Video_VResolution_NonDouble;
       this._cfg.video.size_win.width = SAEC_Video_DEF_AMIGA_WIDTH; /* 360 */
       this._cfg.video.size_win.height = SAEC_Video_DEF_AMIGA_HEIGHT; /* 284 */
     }
     else if (game_data.nativeResolution && game_data.nativeResolution.height == 1440 && game_data.nativeResolution.width == 568)
     {
       this._cfg.video.hresolution = SAEC_Config_Video_HResolution_SuperHiRes;
       this._cfg.video.vresolution = SAEC_Config_Video_VResolution_Double;
       this._cfg.video.size_win.width = SAEC_Video_DEF_AMIGA_WIDTH << 2; /* 1440 */
       this._cfg.video.size_win.height = SAEC_Video_DEF_AMIGA_HEIGHT << 1; /* 568 */
     }
     else
     {
       this._cfg.video.hresolution = SAEC_Config_Video_HResolution_HiRes;
       this._cfg.video.vresolution = SAEC_Config_Video_VResolution_Double;
       this._cfg.video.size_win.width = SAEC_Video_DEF_AMIGA_WIDTH << 1; /* 720 */
       this._cfg.video.size_win.height = SAEC_Video_DEF_AMIGA_HEIGHT << 1; /* 568 */
     }

     this._cfg.memory.rom.name = game_data.rom;
     this._cfg.memory.rom.data = game_data.fs.readFileSync('/'+game_data.rom, null, flag_r);
     this._cfg.memory.rom.size = this._cfg.memory.rom.data.length;

     if (game_data.extRom) {
       this._cfg.memory.extRom.name = game_data.extRom;
       this._cfg.memory.extRom.data = game_data.fs.readFileSync('/'+game_data.extRom, null, flag_r);
       this._cfg.memory.extRom.size = this._cfg.memory.extRom.data.length;
     }

     this._cfg.floppy.drive[0].file.name = game_data.floppy[0];
     this._cfg.floppy.drive[0].file.data = game_data.fs.readFileSync('/'+game_data.floppy[0], null, flag_r);
     this._cfg.floppy.drive[0].file.size = this._cfg.floppy.drive[0].file.data.length;
   }

   SAERunner.prototype.start = function () {
     var err = this._sae.start();
   };

   SAERunner.prototype.pause = function () {
     this._sae.pause();
   };

   SAERunner.prototype.stop = function () {
     this._sae.stop();
   };

   SAERunner.prototype.mute = function () {
     var err = this._sae.mute(true);
     if (err) {
       console.warn("unable to mute; SAE error number", err);
     }
   };

   SAERunner.prototype.unmute = function () {
     var err = this._sae.mute(false);
     if (err) {
       console.warn("unable to unmute; SAE error number", err);
     }
   };

   SAERunner.prototype.onStarted = function (func) {
     this._cfg.hook.event.started = func;
   };

   SAERunner.prototype.onReset = function (func) {
     this._cfg.hook.event.reseted = func;
   };

   SAERunner.prototype.requestFullScreen = function () {
     getfullscreenenabler().call(this._canvas);
   };

   /**
    * Emulator
    */
   function Emulator(canvas, callbacks, loadFiles) {
     if (typeof callbacks !== 'object') {
       callbacks = { before_emulator: null,
                     before_run: callbacks };
     }
     var js_url;
     var requests = [];
     var drawloadingtimer;
     // TODO: Have an enum value that communicates the current state of the emulator, e.g. 'initializing', 'loading', 'running'.
     var has_started = false;
     var loading = false;
     var defaultSplashColors = { foreground: 'white',
                                 background: 'black',
                                 failure: 'red' };
     var splash = { loading_text: "",
                    spinning: true,
                    finished_loading: false,
                    colors: defaultSplashColors,
                    table: null,
                    splashimg: new Image() };

     var runner;

     var muted = false;
     var SDL_PauseAudio;
     this.isMuted = function () { return muted; };
     this.mute = function () { return this.setMute(true); };
     this.unmute = function () { return this.setMute(false); };
     this.toggleMute = function () { return this.setMute(!muted); };
     this.setMute = function (state) {
       muted = state;
       if (runner) {
         if (state) {
           runner.mute();
         } else {
           runner.unmute();
         }
       }
       else {
         try {
           if (!SDL_PauseAudio)
             SDL_PauseAudio = Module.cwrap('SDL_PauseAudio', '', ['number']);
           SDL_PauseAudio(state);
         } catch (x) {
           console.log("Unable to change audio state:", x);
         }
       }
       return this;
     };

     // This is the bare minimum that will allow gamepads to work. If
     // we don't listen for them then the browser won't tell us about
     // them.
     // TODO: add hooks so that some kind of UI can be displayed.
     window.addEventListener("gamepadconnected",
                             function (e) {
                               console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
                                           e.gamepad.index, e.gamepad.id,
                                           e.gamepad.buttons.length, e.gamepad.axes.length);
                             });

     window.addEventListener("gamepaddisconnected",
                             function (e) {
                               console.log("Gamepad disconnected from index %d: %s",
                                           e.gamepad.index, e.gamepad.id);
                             });

     if (/archive\.org$/.test(document.location.hostname) && document.getElementById("gofullscreen")) {
       document.getElementById("gofullscreen").addEventListener("click", this.requestFullScreen);
     }

     var css_resolution, scale, aspectRatio;
     // right off the bat we set the canvas's inner dimensions to
     // whatever it's current css dimensions are; this isn't likely to be
     // the same size that dosbox/jsmame will set it to, but it avoids
     // the case where the size was left at the default 300x150
     if (!canvas.hasAttribute("width")) {
       var style = getComputedStyle(canvas);
       canvas.width = parseInt(style.width, 10);
       canvas.height = parseInt(style.height, 10);
     }

     this.setScale = function(_scale) {
       scale = _scale;
       return this;
     };

     this.setSplashImage = function(_splashimg) {
       if (_splashimg) {
         if (_splashimg instanceof Image) {
           if (splash.splashimg.parentNode) {
             splash.splashimg.src = _splashimg.src;
           } else {
             splash.splashimg = _splashimg;
           }
         } else {
           splash.splashimg.src = _splashimg;
         }
       }
       return this;
     };

     this.setCSSResolution = function(_resolution) {
       css_resolution = _resolution;
       return this;
     };

     this.setAspectRatio = function(_aspectRatio) {
       aspectRatio = _aspectRatio;
       return this;
     };

     this.setCallbacks = function(_callbacks) {
       if (typeof _callbacks !== 'object') {
         callbacks = { before_emulator: null,
                       before_run: _callbacks };
       } else {
         callbacks = _callbacks;
       }
       return this;
     };

     this.setSplashColors = function (colors) {
       splash.colors = colors;
       return this;
     };

     this.setLoad = function (loadFunc) {
       loadFiles = loadFunc;
       return this;
     };

     var start = function (options) {
       if (has_started)
         return false;
       has_started = true;
       var defaultOptions = { waitAfterDownloading: false,
                              hasCustomCSS: false };
       if (typeof options !== 'object') {
         options = defaultOptions;
       } else {
         options.__proto__ = defaultOptions;
       }

       var k, c, game_data;
       setupSplash(canvas, splash, options);
       drawsplash();

       var loading;

       if (typeof loadFiles === 'function') {
         loading = loadFiles(fetch_file, splash);
       } else {
         loading = Promise.resolve(loadFiles);
       }
       loading.then(function (_game_data) {
                      return new Promise(function(resolve, reject) {
                        var inMemoryFS = new BrowserFS.FileSystem.InMemory();
                        // If the browser supports IndexedDB storage, mirror writes to that storage
                        // for persistence purposes.
                        if (BrowserFS.FileSystem.IndexedDB.isAvailable()) {
                          var AsyncMirrorFS = BrowserFS.FileSystem.AsyncMirror,
                              IndexedDB = BrowserFS.FileSystem.IndexedDB;
                          deltaFS = new AsyncMirrorFS(inMemoryFS,
                                                      new IndexedDB(function(e, fs) {
                                                                      if (e) {
                                                                        // we probably weren't given access;
                                                                        // private window for example.
                                                                        // don't fail completely, just don't
                                                                        // use indexeddb
                                                                        deltaFS = inMemoryFS;
                                                                        finish();
                                                                      } else {
                                                                        // Initialize deltaFS by copying files from async storage to sync storage.
                                                                        deltaFS.initialize(function (e) {
                                                                                             if (e) {
                                                                                               reject(e);
                                                                                             } else {
                                                                                               finish();
                                                                                             }
                                                                                           });
                                                                      }
                                                                    },
                                                                    "fileSystemKey" in _game_data ? _game_data.fileSystemKey
                                                                                                  : "emularity"));
                        } else {
                          finish();
                        }

                        function finish() {
                          game_data = _game_data;

                          // Any file system writes to MountableFileSystem will be written to the
                          // deltaFS, letting us mount read-only zip files into the MountableFileSystem
                          // while being able to "write" to them.
                          game_data.fs = new BrowserFS.FileSystem.OverlayFS(deltaFS,
                                                                            new BrowserFS.FileSystem.MountableFileSystem());
                          game_data.fs.initialize(function (e) {
                            if (e) {
                              console.error("Failed to initialize the OverlayFS:", e);
                              reject();
                            } else {
                              var Buffer = BrowserFS.BFSRequire('buffer').Buffer;
                              function fetch(file) {
                                if ('data' in file && file.data !== null && typeof file.data !== 'undefined') {
                                  return Promise.resolve(file.data);
                                }
                                return fetch_file(file.title, file.url, 'arraybuffer', file.optional);
                              }
                              function mountat(drive) {
                                return function (data) {
                                  if (data !== null) {
                                    drive = drive.toLowerCase();
                                    var mountpoint = '/'+ drive;
                                    // Mount into RO MFS.
                                    game_data.fs.getOverlayedFileSystems().readable.mount(mountpoint, BFSOpenZip(new Buffer(data)));
                                  }
                                };
                              }
                              function saveat(filename) {
                                return function (data) {
                                  if (data !== null) {
                                    if (filename.includes('/')) {
                                      var parts = filename.split('/');
                                      for (var i = 1; i < parts.length; i++) {
                                        var path = '/'+ parts.slice(0, i).join('/');
                                        if (!game_data.fs.existsSync(path)) {
                                          game_data.fs.mkdirSync(path);
                                        }
                                      }
                                    }
                                    game_data.fs.writeFileSync('/'+ filename, new Buffer(data), null, flag_w, 0x1a4);
                                  }
                                };
                              }

                              var promises = game_data.files
                                                      .map(function (f) {
                                                             if (f && f.file) {
                                                               if (f.drive) {
                                                                 return fetch(f.file).then(mountat(f.drive));
                                                               } else if (f.mountpoint) {
                                                                 return fetch(f.file).then(saveat(f.mountpoint));
                                                               }
                                                             }
                                                             return null;
                                                           });
                              // this is kinda wrong; it really only applies when we're loading something created by Emscripten
                              if ('emulatorWASM' in game_data && game_data.emulatorWASM && 'WebAssembly' in window) {
                                promises.push(fetch({ title: "WASM Binary", url: game_data.emulatorWASM }).then(function (data) { game_data.wasmBinary = data; }));
                              }
                              Promise.all(promises).then(resolve, reject);
                            }
                          });
                        }
                      });
                    })
              .then(function (game_files) {
                      if (!game_data || splash.failed_loading) {
                        return null;
                      }
                      if (options.waitAfterDownloading) {
                        return new Promise(function (resolve, reject) {
                                             splash.setTitle("Press any key to continue...");
                                             splash.spinning = false;

                                             // stashes these event listeners so that we can remove them after
                                             window.addEventListener('keypress', k = keyevent(resolve));
                                             canvas.addEventListener('click', c = resolve);
                                             splash.splashElt.addEventListener('click', c);
                                           });
                      }
                      return Promise.resolve();
                    },
                    function () {
                      if (splash.failed_loading) {
                        return;
                      }
                      splash.setTitle("Failed to download game data!");
                      splash.failed_loading = true;
                    })
              .then(function () {
                      if (!game_data || splash.failed_loading) {
                        return null;
                      }
                      splash.spinning = true;
                      window.removeEventListener('keypress', k);
                      canvas.removeEventListener('click', c);
                      splash.splashElt.removeEventListener('click', c);

                      // Don't let arrow, pg up/down, home, end affect page position
                      blockSomeKeys();
                      setupFullScreen();
                      disableRightClickContextMenu(canvas);

                      // Emscripten doesn't use the proper prefixed functions for fullscreen requests,
                      // so let's map the prefixed versions to the correct function.
                      canvas.requestPointerLock = getpointerlockenabler();

                      moveConfigToRoot(game_data.fs);

                      if (callbacks && callbacks.before_emulator) {
                        try {
                          callbacks.before_emulator();
                        } catch (x) {
                          console.log(x);
                        }
                      }

                      if ("runner" in game_data) {
                        if (game_data.runner == EmscriptenRunner || game_data.runner == MAMERunner) {
                          // this is a stupid hack. Emscripten-based
                          // apps currently need the runner to be set
                          // up first, then we can attach the
                          // script. The others have to do it the
                          // other way around.
                          runner = setup_runner();
                        }
                      }

                      if (game_data.emulatorJS) {
                        splash.setTitle("Launching Emulator");
                        return attach_script(game_data.emulatorJS);
                      } else {
                        splash.setTitle("Non-system disk or disk error");
                      }
                      return null;
                    },
                    function () {
                      if (!game_data || splash.failed_loading) {
                        return null;
                      }
                      splash.setTitle("Invalid media, track 0 bad or unusable");
                      splash.failed_loading = true;
                    })
              .then(function () {
                      if (!game_data || splash.failed_loading) {
                        return null;
                      }
                      if ("runner" in game_data) {
                        if (!runner) {
                          runner = setup_runner();
                        }
                        runner.start();
                      }
                    });

       function setup_runner() {
         var runner = new game_data.runner(canvas, game_data);
         resizeCanvas(canvas, 1, game_data.nativeResolution, game_data.aspectRatio);
         runner.onStarted(function () {
                            splash.finished_loading = true;
                            splash.hide();
                            if (callbacks && callbacks.before_run) {
                              setTimeout(function() {
                                           callbacks.before_run();
                                         },
                                         0);
                            }
                          });
         runner.onReset(function () {
                          if (muted) {
                            runner.mute();
                          }
                        });
         return runner;
       }

       return this;
     };
     this.start = start;

     var formatSize = function (event) {
       if (event.lengthComputable)
         return "("+ (event.total ? (event.loaded / event.total * 100).toFixed(0)
                                  : "100") +
                "%; "+ formatBytes(event.loaded) +
                " of "+ formatBytes(event.total) +")";
       return "("+ formatBytes(event.loaded) +")";
     };

     var formatBytes = function (bytes, base10) {
         if (bytes === 0)
           return "0 B";
         var unit = base10 ? 1000 : 1024,
             units = base10 ? ["B", "kB","MB","GB","TB","PB","EB","ZB","YB"]
                            : ["B", "KiB","MiB","GiB","TiB","PiB","EiB","ZiB","YiB"],
             exp = parseInt((Math.log(bytes) / Math.log(unit))),
             size = bytes / Math.pow(unit, exp);
         return size.toFixed(1) +' '+ units[exp];
     };

     var fetch_file = function (title, url, rt, optional) {
       var needsCSS = splash.table.dataset.hasCustomCSS == "false";
       var row = addRow(splash.table);
       var titleCell = row[0], statusCell = row[1];
       titleCell.textContent = title;
       return new Promise(function (resolve, reject) {
                            var xhr = new XMLHttpRequest();
                            xhr.open('GET', url, true);
                            xhr.responseType = rt || 'arraybuffer';
                            xhr.onprogress = function (e) {
                                               titleCell.innerHTML = title +" <span style=\"font-size: smaller\">"+ formatSize(e) +"</span>";
                                             };
                            xhr.onload = function (e) {
                                           if (xhr.status === 200) {
                                             success();
                                             resolve(xhr.response);
                                           } else if (optional) {
                                             success();
                                             resolve(null);
                                           } else {
                                             failure();
                                             reject();
                                           }
                                         };
                            xhr.onerror = function (e) {
                                            if (optional) {
                                              success();
                                              resolve(null);
                                            } else {
                                              failure();
                                              reject();
                                            }
                                          };
                            function success() {
                              statusCell.textContent = "✔";
                              titleCell.parentNode.classList.add('emularity-download-success');
                              titleCell.textContent = title;
                              if (needsCSS) {
                                titleCell.style.fontWeight = 'bold';
                                titleCell.parentNode.style.backgroundColor = splash.getColor('foreground');
                                titleCell.parentNode.style.color = splash.getColor('background');
                              }
                            }
                            function failure() {
                              statusCell.textContent = "✘";
                              titleCell.parentNode.classList.add('emularity-download-failure');
                              titleCell.textContent = title;
                              if (needsCSS) {
                                titleCell.style.fontWeight = 'bold';
                                titleCell.parentNode.style.backgroundColor = splash.getColor('failure');
                                titleCell.parentNode.style.color = splash.getColor('background');
                              }
                            }
                            xhr.send();
                          });
     };

     function keyevent(resolve) {
       return function (e) {
                if (e.which == 32) {
                  e.preventDefault();
                  resolve();
                }
              };
     };

     var resizeCanvas = function (canvas, scale, resolution, aspectRatio) {
       if (scale && resolution) {
         // optimizeSpeed is the standardized value. different
         // browsers support different values; they will all ignore
         // values that they don't understand.
         canvas.style.imageRendering = '-moz-crisp-edges';
         canvas.style.imageRendering = '-o-crisp-edges';
         canvas.style.imageRendering = '-webkit-optimize-contrast';
         canvas.style.imageRendering = 'optimize-contrast';
         canvas.style.imageRendering = 'crisp-edges';
         canvas.style.imageRendering = 'pixelated';
         canvas.style.imageRendering = 'optimizeSpeed';

         canvas.style.width = resolution.width * scale +'px';
         canvas.style.height = resolution.height * scale +'px';
         canvas.width = resolution.width;
         canvas.height = resolution.height;
       }
     };

     var clearCanvas = function () {
       var context = canvas.getContext('2d');
       context.fillStyle = splash.getColor('background');
       context.fillRect(0, 0, canvas.width, canvas.height);
       console.log("canvas cleared");
     };

     function setupSplash(canvas, splash, globalOptions) {
       splash.splashElt = document.getElementById("emularity-splash-screen");
       if (!splash.splashElt) {
         splash.splashElt = document.createElement('div');
         splash.splashElt.classList.add("emularity-splash-screen");
         if (!globalOptions.hasCustomCSS) {
           splash.splashElt.style.position = 'absolute';
           splash.splashElt.style.top = '0';
           splash.splashElt.style.left = '0';
           splash.splashElt.style.right = '0';
           splash.splashElt.style.color = splash.getColor('foreground');
           splash.splashElt.style.backgroundColor = splash.getColor('background');
         }
         canvas.parentElement.appendChild(splash.splashElt);
       }

       splash.splashimg.classList.add("emularity-splash-image");
       if (!globalOptions.hasCustomCSS) {
         splash.splashimg.style.display = 'block';
         splash.splashimg.style.marginLeft = 'auto';
         splash.splashimg.style.marginRight = 'auto';
       }
       splash.splashElt.appendChild(splash.splashimg);

       splash.titleElt = document.createElement('span');
       splash.titleElt.classList.add("emularity-splash-title");
       if (!globalOptions.hasCustomCSS) {
         splash.titleElt.style.display = 'block';
         splash.titleElt.style.width = '100%';
         splash.titleElt.style.marginTop = "1em";
         splash.titleElt.style.marginBottom = "1em";
         splash.titleElt.style.textAlign = 'center';
         splash.titleElt.style.font = "24px sans-serif";
       }
       splash.titleElt.textContent = " ";
       splash.splashElt.appendChild(splash.titleElt);

       var table = document.getElementById("emularity-progress-indicator");
       if (!table) {
         table = document.createElement('table');
         table.classList.add("emularity-progress-indicator");
         table.dataset.hasCustomCSS = globalOptions.hasCustomCSS;
         if (!globalOptions.hasCustomCSS) {
           table.style.width = "75%";
           table.style.color = splash.getColor('foreground');
           table.style.backgroundColor = splash.getColor('background');
           table.style.marginLeft = 'auto';
           table.style.marginRight = 'auto';
           table.style.borderCollapse = 'separate';
           table.style.borderSpacing = "2px";
         }
         splash.splashElt.appendChild(table);
       }
       splash.table = table;
     }

     splash.setTitle = function (title) {
       splash.titleElt.textContent = title;
     };

     splash.hide = function () {
       splash.splashElt.style.display = 'none';
     };

     splash.getColor = function (name) {
       return name in splash.colors ? splash.colors[name]
                                    : defaultSplashColors[name];
     };

     var addRow = function (table) {
       var needsCSS = table.dataset.hasCustomCSS == "false";
       var row = table.insertRow(-1);
       if (needsCSS) {
         row.style.textAlign = 'center';
       }
       var cell = row.insertCell(-1);
       if (needsCSS) {
         cell.style.position = 'relative';
       }
       var titleCell = document.createElement('span');
       titleCell.classList.add("emularity-download-title");
       titleCell.textContent = '—';
       if (needsCSS) {
         titleCell.style.verticalAlign = 'center';
         titleCell.style.minHeight = "24px";
         titleCell.style.whiteSpace = "nowrap";
       }
       cell.appendChild(titleCell);
       var statusCell = document.createElement('span');
       statusCell.classList.add("emularity-download-status");
       if (needsCSS) {
         statusCell.style.position = 'absolute';
         statusCell.style.left = "0";
         statusCell.style.paddingLeft = "0.5em";
       }
       cell.appendChild(statusCell);
       return [titleCell, statusCell];
     };

     var drawsplash = function () {
       canvas.setAttribute('moz-opaque', '');
       if (!splash.splashimg.src) {
         splash.splashimg.src = "logo/emularity_color_small.png";
       }
     };

     function attach_script(js_url) {
       return new Promise(function (resolve, reject) {
                            var newScript;
                            function loaded(e) {
                              if (e.target == newScript) {
                                newScript.removeEventListener("load", loaded);
                                newScript.removeEventListener("error", failed);
                                resolve();
                              }
                            }
                            function failed(e) {
                              if (e.target == newScript) {
                                newScript.removeEventListener("load", loaded);
                                newScript.removeEventListener("error", failed);
                                reject();
                              }
                            }
                            if (js_url) {
                              var head = document.getElementsByTagName('head')[0];
                              newScript = document.createElement('script');
                              newScript.addEventListener("load", loaded);
                              newScript.addEventListener("error", failed);
                              newScript.type = 'text/javascript';
                              newScript.src = js_url;
                              head.appendChild(newScript);
                            }
                          });
     }

     function getpointerlockenabler() {
       return canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
     }

     this.isfullscreensupported = function () {
        return !!(getfullscreenenabler());
     };

     function setupFullScreen() {
       var self = this;
       var fullScreenChangeHandler = function() {
                                       if (!(document.mozFullScreenElement || document.fullScreenElement)) {
                                         resizeCanvas(canvas, scale, css_resolution, aspectRatio);
                                       }
                                     };
       if ('onfullscreenchange' in document) {
         document.addEventListener('fullscreenchange', fullScreenChangeHandler);
       } else if ('onmozfullscreenchange' in document) {
         document.addEventListener('mozfullscreenchange', fullScreenChangeHandler);
       } else if ('onwebkitfullscreenchange' in document) {
         document.addEventListener('webkitfullscreenchange', fullScreenChangeHandler);
       }
     };

     this.requestFullScreen = function () {
       if (typeof Module == "object" && "requestFullScreen" in Module) {
         Module.requestFullScreen(1, 0);
       } else if (runner) {
         runner.requestFullScreen();
       }
     };

     /**
       * Prevents page navigation keys such as page up/page down from
       * moving the page while the user is playing.
       */
     function blockSomeKeys() {
       function keypress (e) {
         if (e.which >= 33 && e.which <= 40) {
           e.preventDefault();
           return false;
         }
         return true;
       }
       window.onkeydown = keypress;
     }

     /**
       * Disables the right click menu for the given element.
       */
     function disableRightClickContextMenu(element) {
       element.addEventListener('contextmenu',
                                function (e) {
                                  if (e.button == 2) {
                                    // Block right-click menu thru preventing default action.
                                    e.preventDefault();
                                  }
                                });
     }
   };

   /**
    * misc
    */
   function getfullscreenenabler() {
     return canvas.requestFullScreen || canvas.webkitRequestFullScreen || canvas.mozRequestFullScreen;
   }

   function BFSOpenZip(loadedData) {
       return new BrowserFS.FileSystem.ZipFS(loadedData);
   };

   // This is such a hack. We're not calling the BrowserFS api
   // "correctly", so we have to synthesize these flags ourselves
   var flag_r = { isReadable: function() { return true; },
                  isWriteable: function() { return false; },
                  isTruncating: function() { return false; },
                  isAppendable: function() { return false; },
                  isSynchronous: function() { return false; },
                  isExclusive: function() { return false; },
                  pathExistsAction: function() { return 0; },
                  pathNotExistsAction: function() { return 1; }
                };
   var flag_w = { isReadable: function() { return false; },
                  isWriteable: function() { return true; },
                  isTruncating: function() { return false; },
                  isAppendable: function() { return false; },
                  isSynchronous: function() { return false; },
                  isExclusive: function() { return false; },
                  pathExistsAction: function() { return 0; },
                  pathNotExistsAction: function() { return 3; }
                };

   /**
    * Searches for dosbox.conf, and moves it to '/dosbox.conf' so dosbox uses it.
    */
   function moveConfigToRoot(fs) {
     var dosboxConfPath = null;
     // Recursively search for dosbox.conf.
     function searchDirectory(dirPath) {
       fs.readdirSync(dirPath).forEach(function(item) {
         if (dosboxConfPath) {
           return;
         }
         // Avoid infinite recursion by ignoring these entries, which exist at
         // the root.
         if (item === '.' || item === '..') {
           return;
         }
         // Append '/' between dirPath and the item's name... unless dirPath
         // already ends in it (which always occurs if dirPath is the root, '/').
         var itemPath = dirPath + (dirPath[dirPath.length - 1] !== '/' ? "/" : "") + item,
             itemStat = fs.statSync(itemPath);
         if (itemStat.isDirectory(itemStat.mode)) {
           searchDirectory(itemPath);
         } else if (item === 'dosbox.conf') {
           dosboxConfPath = itemPath;
         }
       });
     }

     searchDirectory('/');

     if (dosboxConfPath !== null) {
       fs.writeFileSync('/dosbox.conf',
                        fs.readFileSync(dosboxConfPath, null, flag_r),
                        null, flag_w, 0x1a4);
     }
   };

   function extend(a, b) {
     if (a === null)
       return b;
     if (b === null)
       return a;
     var ta = typeof a,
         tb = typeof b;
     if (ta !== tb) {
       if (ta === 'undefined')
         return b;
       if (tb === 'undefined')
         return a;
       throw new Error("Cannot extend an "+ ta +" with an "+ tb);
     }
     if (Array.isArray(a))
       return a.concat(b);
     if (ta === 'object') {
       Object.keys(b).forEach(function (k) {
                                a[k] = extend(k in a ? a[k] : undefined, b[k]);
                              });
       return a;
     }
     return b;
   }

   function dict_from_xml(xml) {
     if (xml instanceof XMLDocument) {
       xml = xml.documentElement;
     }
     var dict = {};
     var len = xml.childNodes.length, i;
     for (i = 0; i < len; i++) {
       var node = xml.childNodes[i];
       dict[node.nodeName] = node.textContent;
     }
     return dict;
   }

   function list_from_xml(xml) {
     if (xml instanceof XMLDocument) {
       xml = xml.documentElement;
     }
     return Array.prototype.slice.call(xml.childNodes);
   }

   function files_from_filelist(xml) {
     return list_from_xml(xml).filter(function (node) {
                                        return "getAttribute" in node;
                                      })
                              .map(function (node) {
                                     var file = dict_from_xml(node);
                                     file.name = node.getAttribute("name");
                                     return file;
                              });
   }

   function files_with_ext_from_filelist(xml, ext) {
     if (!ext) {
       return [];
     }
     if (!ext.startsWith('.')) {
       ext = '.'+ ext;
     }
     ext = ext.toLowerCase();
     return files_from_filelist(xml).filter(function (file) {
                                              return file.name.toLowerCase().endsWith(ext);
                                            });
   }

   function meta_props_matching(meta, regex) {
     if (typeof regex == "string")
       regex = RegExp(regex);
     return Object.keys(meta).map(function (k) {
                                    let match = regex.exec(k);
                                    if (match)
                                      return [k, match];
                                    return null;
                                  })
                             .filter(function (result) {
                               return !!result;
                             });
   }

   function _SDL_CreateRGBSurfaceFrom(pixels, width, height, depth, pitch, rmask, gmask, bmask, amask) {
     // TODO: Actually fill pixel data to created surface.
     // TODO: Take into account depth and pitch parameters.
     // console.log('TODO: Partially unimplemented SDL_CreateRGBSurfaceFrom called!');
     var surface = SDL.makeSurface(width, height, 0, false, 'CreateRGBSurfaceFrom', rmask, gmask, bmask, amask);

     var surfaceData = SDL.surfaces[surface];
     var surfaceImageData = surfaceData.ctx.getImageData(0, 0, width, height);
     var surfacePixelData = surfaceImageData.data;

     // Fill pixel data to created surface.
     // Supports SDL_PIXELFORMAT_RGBA8888 and SDL_PIXELFORMAT_RGB888
     var channels = amask ? 4 : 3; // RGBA8888 or RGB888
     for (var pixelOffset = 0; pixelOffset < width*height; pixelOffset++) {
       surfacePixelData[pixelOffset*4+0] = HEAPU8[pixels + (pixelOffset*channels+0)]; // R
       surfacePixelData[pixelOffset*4+1] = HEAPU8[pixels + (pixelOffset*channels+1)]; // G
       surfacePixelData[pixelOffset*4+2] = HEAPU8[pixels + (pixelOffset*channels+2)]; // B
       surfacePixelData[pixelOffset*4+3] = amask ? HEAPU8[pixels + (pixelOffset*channels+3)] : 0xff; // A
     };

     surfaceData.ctx.putImageData(surfaceImageData, 0, 0);

     return surface;
   }

   window.IALoader = IALoader;
   window.DosBoxLoader = DosBoxLoader;
   window.JSMESSLoader = MAMELoader; // depreciated; just for backwards compatibility
   window.JSMAMELoader = MAMELoader; // ditto
   window.MAMELoader = MAMELoader;
   window.SAELoader = SAELoader;
   window.PCELoader = PCELoader;
   window.Emulator = Emulator;
   window._SDL_CreateRGBSurfaceFrom = _SDL_CreateRGBSurfaceFrom;
 })(typeof Promise === 'undefined' ? ES6Promise.Promise : Promise);

// legacy
var JSMESS = JSMESS || {};
JSMESS.ready = function (f) { f(); };
