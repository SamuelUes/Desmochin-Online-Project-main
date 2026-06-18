import { DesmocheScene } from './DesmocheScene.js';

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-game',
    backgroundColor: '#211105',
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'phaser-game',
        width: window.innerWidth,
        height: window.innerHeight
    },
    scene: [DesmocheScene]
};

window.addEventListener('load', () => {
    window.desmocheGame = new Phaser.Game(config);
});
