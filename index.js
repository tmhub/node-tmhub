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
        },
        generateComposerJson: function(packagename) {
            packagename = packagename || tm.getModuleInfo().name;
            var filename = 'composer.json';
            if (fs.existsSync(filename)) {
                return;
            }
            var content = {
                "minimum-stability": "dev",
                "require": {
                    "%packagename%": "*"
                },
                "repositories": [
                    {
                        "type": "composer",
                        "url": "http://tmhub.github.io/packages"
                    }
                ],
                "extra": {
                    "magento-root-dir": "code/",
                    "magento-deploystrategy": "copy",
                    "magento-force": true
                }
            };
            content = JSON.stringify(content)
                .replace('"%packagename%"', '"' + packagename + '"');

            fs.writeFile(filename, content, 'utf8', function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("The " + filename + " file was generated!");
                }
            });
        }
    };
}());