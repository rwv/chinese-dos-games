import os
import subprocess
import sys


# Run Emscripten's file packager from the appropriate directory
def run_packager(src, output):
    def error(s):
        print(s, file=sys.stderr)
        sys.exit(1)

    # Find folder in PATH environment variable which contains specified file
    def find_in_path(fn):
        for d in os.environ["PATH"].split(os.pathsep):
            if os.path.isfile(os.path.join(d, fn)):
                return d
        return None

    # Find Emscripten from EMSCRIPTEN_ROOT or by searching via PATH
    def find_emscripten():
        if 'EMSCRIPTEN_ROOT' in globals():
            em_path = EMSCRIPTEN_ROOT
        else:
            em_path = find_in_path('emcc');

        if em_path is None or not os.path.isdir(em_path):
            error("Can't find Emscripten. Add it to PATH or set EMSCRIPTEN_ROOT.");

        return em_path;

    # Find Emscripten's file packager
    def find_packager():
        p = os.path.join(find_emscripten(), "tools", "file_packager.py");
        if not os.path.isfile(p):
            error('Emscripten file_packager.py not found.')
        return p;

    PACKAGE_ARG = '.'
    if src != '':
        # Need to change directory because paths in package are
        # relative to directory where Emscripten packager is run.
        cwd = os.getcwd()
        os.chdir(src)
        if os.path.isabs(output):
            datafile = output
        else:
            datafile = os.path.join(cwd, output)
    else:
        datafile = output

    packager_path = find_packager();

    if 'PYTHON' in globals():
        python_path = PYTHON
    else:
        python_path = sys.executable

    try:
        res = subprocess.check_output([python_path, packager_path,
                                       datafile,
                                       "--no-heap-copy",
                                       "--preload",
                                       PACKAGE_ARG], universal_newlines=True)
        # TODO: res contains the path of data file on host, need to remove.
    except:
        error('Error reported by Emscripten packager.')

    if src != '':
        os.chdir(cwd)

    return res


def generate_script(command, script):
    # cmdline = "'./{}'".format(command)  # remove the detection of executable file
    script += "Module['arguments'] = [ {} ];\n".format(command)
    return script
