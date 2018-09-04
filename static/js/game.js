function htmlFullscreen() {
    var gameCanvas = document.getElementById('canvas');
    var exitButton = document.getElementById('exit_button')
    if (gameCanvas.classList.contains('html-fullscreen')) {
        gameCanvas.classList.remove('html-fullscreen');
        exitButton.classList.remove('exit_fullscreen_show');
    }
    else {
        gameCanvas.classList.add('html-fullscreen');
        exitButton.classList.add('exit_fullscreen_show');
    }
}