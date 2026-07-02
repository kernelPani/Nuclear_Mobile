"""Bridge that runs the bundled yt-dlp exactly like the desktop CLI does.

The Rust side passes the same argument list it would hand the yt-dlp binary
(e.g. ["--dump-json", "--flat-playlist", "ytsearch10:..."]). We invoke yt-dlp's
CLI entry point and capture stdout, so the output is byte-for-byte what the
desktop path produces and the existing Rust NDJSON/JSON parsing is reused
unchanged.
"""

import io
import sys


def run(args):
    import yt_dlp

    argv = [str(arg) for arg in args]
    out_buffer = io.StringIO()
    err_buffer = io.StringIO()
    previous_stdout = sys.stdout
    previous_stderr = sys.stderr
    sys.stdout = out_buffer
    sys.stderr = err_buffer

    exit_code = 0
    try:
        try:
            yt_dlp.main(argv)
        except SystemExit as system_exit:
            exit_code = system_exit.code or 0
    finally:
        sys.stdout = previous_stdout
        sys.stderr = previous_stderr

    if exit_code != 0:
        message = err_buffer.getvalue().strip()
        raise RuntimeError(message or "yt-dlp exited with code {}".format(exit_code))

    return out_buffer.getvalue()
