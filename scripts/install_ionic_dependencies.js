const helpers = require('./helpers');
const path = require('path');
const fs = require('fs');

const DEST_PATH = process.argv[2];

// Caminho mais confiável para a raiz do projeto, partindo da localização do script.
// O script está em: /raiz_do_projeto/plugins/nome_plugin/scripts/
const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');

const shouldInstallIonicDependencies = function () {
    const packageFilePath = path.join(PROJECT_ROOT, 'package.json');

    if (!helpers.fileExists(packageFilePath)) {
        helpers.logWarning('package.json was not found.');
        helpers.logWarning('Ionic dependencies omission cannot be safely skipped.');
        return true;
    }
    
    let packageDataString;
    try {
        packageDataString = fs.readFileSync(packageFilePath, 'utf8');
    } catch (e) {
        helpers.logWarning('package.json found is unreadable.', e);
        helpers.logWarning('Ionic dependencies omission cannot be safely skipped.');
        return true;
    }
    
    let packageData;
    try {
        packageData = JSON.parse(packageDataString);
    } catch (e) {
        helpers.logWarning('package.json could not be parsed.', e);
        helpers.logWarning('Ionic dependencies omission cannot be safely skipped.');
        return true;
    }
    
    return !!(
        packageData &&
        packageData.dependencies &&
        packageData.dependencies['@ionic-native/core']
    );
};

const installIonicDependencies = function () {
    // O objetivo real do script é instalar dependências DENTRO da pasta do próprio plugin.
    // O caminho correto é um nível acima da pasta 'scripts' e depois para dentro de DEST_PATH.
    const fullDestPath = path.join(__dirname, '..', DEST_PATH);

    try {
        // Verifica se o diretório de destino realmente existe antes de tentar entrar nele.
        if (!fs.existsSync(fullDestPath) || !fs.statSync(fullDestPath).isDirectory()) {
             helpers.logError(`Destination directory does not exist or is not a directory: ${fullDestPath}`);
             return;
        }
        process.chdir(fullDestPath);
    } catch (error) {
        helpers.logError(`Failed to change directory to ${fullDestPath}!`, error);
        helpers.logError(
            `Please run \`cd node_modules/cordova-plugin-fcm-with-dependecy-updated/${DEST_PATH}; npm install\` manually`
        );
        return;
    }
    
    console.log(`Running 'npm install' in: ${process.cwd()}`);
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    
    helpers
        .execute(npm, ['install', '--loglevel', 'error', '--no-progress'])
        .catch(function (e) {
            helpers.logError('Failed to auto install Ionic dependencies!', e);
            helpers.logError(
                `Please run \`cd node_modules/cordova-plugin-fcm-with-dependecy-updated/${DEST_PATH}; npm install\` manually`
            );
        })
        .then(function (output) {
            console.log(`Ionic dependencies installed for ${DEST_PATH}:`);
            console.log(output);
        });
};

if (shouldInstallIonicDependencies()) {
    installIonicDependencies();
} else {
    console.log(`Ionic dependencies install skipped for ${DEST_PATH}`);
}
