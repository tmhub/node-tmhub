var exec = require('child_process').exec,
    fs = require('fs');

var tmhub = exports.tmhub = (function() {
    var moduleInfo = {};

    function loadModuleInfo() {
        var data = fs.readFileSync('../composer.json', {
            encoding: 'utf8'
        });

        moduleInfo = JSON.parse(data);
        moduleInfo.shortname = moduleInfo.name.replace('tm/', '');
    }

    return {
        getModuleInfo: function() {
            if (!moduleInfo.name) {
                loadModuleInfo();
            }
            return moduleInfo;
        },
        getArchiveName: function(suffix) {
            suffix = suffix || '';
            return [
                this.getModuleInfo().shortname,
                '-',
                this.getModuleInfo().version,
                suffix,
                '.zip'
            ].join('');
        }
    };
}());