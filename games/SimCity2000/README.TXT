SIMCITY 2000 (TM) 
Last Minute Info 
12/27/93 
----------------- 
 
Please read _ALL_ of this document! This stuff is important! 
 
It covers a lot about memory, installation, various graphics cards and 
sound cards, gameplay issues, importing cities from other versions of 
SimCity 2000 and hot keys.   
 
** MOST IMPORTANT STUFF--ABOUT MEMORY 
 
SimCity 2000 requires a lot of memory to run--4 MB total, but also a lot 
of free memory in the conventional 640K range. On some machines, even if 
you have the required 4 MB, SimCity 2000 may report that you do not have 
enough free extended or conventional memory. If this is the case, your 
best alternative is to create a boot disk as outlined on page 6 of the 
SimCity 2000 DOS Addendum/Quick Start Guide. Another solution that may 
help is to install SimCity 2000 with No Sound and No Music selected. If 
you have already installed SimCity 2000, you can change your current 
sound, music, and video settings by running the INSTALL.EXE program in 
the SimCity 2000 directory. 
 
We recommend that you not load any memory managers or disk cache  
utilities while running SimCity 2000. Especially if you are using 
DOS 6 on a machine with only 4 MB RAM. 
 
If you are using a memory manager, you MUST NOT have it set in auto  
mode--this will cause a conflict with SimCity 2000. 
 
 
If you are using MS-DOS 6 and absolutely must load EMM386.EXE, 
you will need to either have the EMS size set to 'noems' or larger 
than 4096. See your DOS manual for information on how to do this. 
 
 
** INSTALLING STUFF 
 
Video Selection 
--------------- 
The SimCity 2000 installer will attempt to figure out what kind of 
video card you have in your machine. If it can, it will list that card 
in the video selection window. If it is not sure what kind of video 
card you have, or the installer detects a VESA driver in memory (or 
in BIOS), it will default to the VESA VIDEO DRIVER. You can click on 
the arrow to the right of the VESA VIDEO DRIVER entry for a list of 
other cards that the installer thinks you might have. If your card is 
on this list, you can select it instead of the defaulted VESA driver. 
 
Sound Selection 
--------------- 
SimCity 2000 cannot automatically detect what kind of sound card you 
have in your machine. You will need to pick your sound card(s) 
out of the lists provided. The installer will then try to verify the 
presence of that sound card in your machine. If the installer is 
unable to detect the sound card you have specified, certain hardware 
settings on your card may be different than what SimCity 2000 is 
expecting. To change these settings, select the Change Settings 
option from the sound card verification window (Where it says "OK" 
or "Failed!"). For more information on these hardware settings, see 
the manual that came with your sound card. 
 
 
** VIDEO CARD SUPPORT 
 
VESA Drivers 
------------ 
SimCity 2000 supports a variety of different video cards and VESA mode 
101 (640x480x256 colors). VESA stands for Video Electronics Standards 
Association. If you do not find your video card listed by name in the 
installer, we recommend that you pick VESA VIDEO DRIVER and run a 
VESA driver supported by your video card before booting SimCity 2000.  
Some video cards have built-in VESA drivers so you won't need to 
manually load a driver. Other video cards have an external file that 
needs to be run from the DOS command line before running SimCity 2000. 
Others, like the Diamond Viper VLB, have the VESA driver built into 
the video card BIOS, but you still need to tell the card to load the 
driver before running SimCity 2000. In the case of the Diamond Viper 
VLB, you would need to type 'VPRMODE VESA' [Enter} at the command line 
to load the driver.  
 
If the VESA driver is an external program, it would probably be found  
on the disks that came with your video card. If you don't have a VESA  
driver you should contact your video card manufacturer. We have  
included VESA drivers for most popular cards on your SimCity 2000
disk 1.
 
ATI Ultra Pro or Mach 32 Video Cards 
------------------------------------ 
If you have an ATI Ultra Pro or other card based on the Mach 32 chip,  
you must run the included utility MW_ATIUP.EXE before playing  
SimCity, for complete compatibility. 

Simply type:    MW_ATIUP [Enter] 
then type:      SC2000   [Enter] 
 
to use your ATI card with SimCity 2000. 
 
Trident Video Cards 
------------------- 
Some older Trident video cards may not be compatible with the Trident  
driver installed by SimCity 2000. If you installed a Trident video  
card and are experiencing video problems, try running the INSTALL.EXE  
program in the SimCity 2000 directory and selecting the VESA video 
driver. 
 
 
** SOUND CARD SUPPORT 
 
Miles Design Drivers 
-------------------- 
SimCity 2000 sound support is accomplished through the use of the 
John Miles Design AIL audio driver libraries. These drivers are 
available for many different sound cards, most of which are included 
and installed by the SimCity 2000 installer. If your sound card is 
not mentioned specifically in the installer, you may be able to get 
drivers from the manufacturer for full SimCity 2000 sound. 
SimCity 2000 requires "32-bit flat mode" Miles Design drivers. 
Non-32-bit drivers will not work. 
 
Pro Audio Spectrum 
------------------ 
MUSIC: The Music Driver for the Pro Audio Spectrum requires the Media 
Vision Driver MVSOUND.SYS to be loaded in memory as a driver in  
your CONFIG.SYS file. If this driver is not loaded, you will receive a 
verification failure during installation, and you will NOT hear music 
during the game. For more information about MVSOUND.SYS, please 
refer to your Pro Audio Spectrum users manual, or call Media Vision 
Technical Support. 
 
SOUND EFFECTS: If you choose Pro Audio Spectrum as your Sound 
Effects sound card, you may experience some sound effects "dropouts," 
or even no sound at all. This will only happen on some Pro Audio 
Spectrum sound cards. If this does happen, you can re-run the INSTALL 
program and choose Sound Blaster for the Sound Effects Card, instead 
of Pro Audio Spectrum. 
 
CAUTION:  This may or may not work depending on your Pro Audio 
Spectrum. Please call Media Vision Technical Support if you have more 
problems. 
 
Gravis Ultrasound 
----------------- 
SimCity 2000 is compatible with the SBOS Sound Blaster Emulation TSR 
for the GUS. However, it is NOT compatible with both SBOS and most 
memory managers (such as EMM386) loaded the same time. DO NOT attempt 
to run or even install SimCity 2000 with both SBOS and a memory 
manager present. Bad things may happen. 
 
Aria Sound Cards 
---------------- 
We now have Miles Design Drivers for all sound cards based on the 
ARIA Sound Synth by Sierra Semiconductor. These include: 
 
Viva Maestro 16  
VR Alpha Systems  
Cyber Audio  
Add Tech Sound 2000  
Sound Tower  
Cardinal Technologies Sound Pilot  
Diamond Computer Systems Sonic Sound  
Sonic Sound Pro  
Genoa Systems AudioBahn 
AudioBahn Listener  
Kingston Technologies Omnivox  
Zoltrix TESS 
and Others... 
 
** GAME PLAY ISSUES 
 
Saved Cities
------------
For your simulating pleasure, we have included several saved cities
created by various Maxis employees. They are located in your 
SimCity 2000 directory.

Micro-Simulators 
---------------- 
When querying some structures, you get local statistics about that 
structure. For instance, querying on a Police Station will tell you 
how many crimes and arrests were handled by that station, querying 
on a school will tell how many teachers and students are attending 
as well as the average grade of the students. Most placeable 
structures have these microsimulators (police, fire, schools, 
colleges, power plants, the Mayor's House, arcologies, etc). Some 
structures share one microsimulator for all the structures placed. 
Things like the bus system, railroad depots, marinas, libraries, 
windmills, and hydroelectric power plants among others have 1 
microsimulator for each category (one microsimulator for all the bus 
stations, one for all the railroad depots, etc). Where is this 
all headed, you ask? Well, each city can only have 150 
microsimulators in it. If you go beyond that, the structure you place 
will still affect the simulator globally (police stations will still 
stop crime, bus stations will still carry passengers, arcologies will 
still hold people), but you just won't be able to see any local 
information on those structures. This isn't going to harm your city 
in any way. We're telling you this because it's pretty easy to run 
out of microsimulators in a large city and we don't want you thinking 
something's wrong. 
 
Terrain Editing 
--------------- 
If you are building a city and go into the terrain edit mode, your 
city will disappear, but any trees or water that you have placed in 
the city will show up in edit terrain mode. Also, if you have placed 
a bridge or other structure that automatically builds landfill, the 
landfill will also show up in edit terrain mode. These can be removed 
with the lower terrain tool. 
 
Airports 
-------- 
Keep in mind when building an airport that it needs space for a 
runway, or it will not build. The minimum useable airport space is 
2 x 6 tiles. Your best bet is to build the airport in 4 x 6 tile 
increments. And make sure no tall buildings are nearby, SimCity 2000 
pilots are not known for their building-avoidance skills! 
In addition, make sure that your airport is blanketed with power 
lines. Airports may not initially build unless they are receiving 
power to certain tiles. 

 
** IMPORTING OTHER CITIES 
 
Importing Cities From SimCity Classic and SimCity 2000 Mac 
---------------------------------------------------------- 
You can load saved cities from both SimCity Classic and SimCity 2000 
Mac into SimCity 2000 DOS. 
 
To import SimCity Classic DOS and SimCity 2000 Mac saved games, 
rename the file so that the extension is ".SC2". If the file is from 
SimCity Classic DOS, SimCity 2000 will ask you if you wish to convert 
the file to SimCity 2000 format. The conversion will not change the 
original file until you save it. 
 
To convert SimCity 2000 DOS files for use in SimCity 2000 Mac you 
will need to give the file a Filetype and Creator for the Macintosh.
This can be done with ResEdit, Access PC, or one of several other
PC->Mac conversion utilities.
 
**NEWSPAPER

If you are running low on hard drive space, you may experience a 
problem where multiple newspaper stories are open at one time.  You
will need at least 300KB free hard drive space (on the drive that
SimCity 2000 is installed to) before starting the game, and this 
will fix the problem.  If you do get multiple stories, you can clear
them by pressing 'ENTER'.

If you are running into low memory situations, the Newspaper menu item
may gray out.  Don't be alarmed, it won't hurt anything.

** HOT KEYS 
 
SHIFT KEY-  
1. While placing items, press the shift key before releasing the mouse 
button will cancel placement of the item.  
2. Holding down the shift key while clicking on an item in the edit 
window will open the Query window on that specific item.  
3. Holding down the shift key while clicking on a button or entry in 
a window will open a help description on that item. 
 
CTRL - temporarily turns the current cursor into the Bulldoze Tool. 
HOME - zooms in one level on your city 
END - zooms out one level on your city 
DEL - rotates your city view left 90 degrees 
PAGE DOWN - rotates your city right 90 degrees 
Cursors Keys - scrolls around city 
 
Thanks for buying SimCity 2000 
We hope you enjoy playing it as much as we enjoyed creating it! 
 


[EOF] 
------------------------------------------------------------------------- 
 

