var exec         = require('child_process').exec,
    fs           = require('fs')
    GitHubApi    = require('github'),
    readlineSync = require('readline-sync'),
    triplesec    = require ('triplesec')
;

var tmhub = exports.tmhub = (function() {
    var moduleInfo = {};

    function loadModuleInfo() {
        var data = fs.readFileSync('../composer.json', {
            encoding: 'utf8'
        });

        moduleInfo = JSON.parse(data);
        moduleInfo.shortname = moduleInfo.name.replace('tm/', '');
    }

    var github = false;

    function getGithub(callback) {
        if (false != github) {
            if ('function' == typeof callback) {
                callback();
            }
            return github;
        }
        github = new GitHubApi({
            // required
            version: "3.0.0",
            // optional
            debug: false,
            protocol: "https",
    //        host: "github.my-GHE-enabled-company.com",
    //        pathPrefix: "/api/v3", // for some GHEs
            timeout: 5000
        });

        var passphrase = readlineSync.question("Passphrase : ", {noEchoBack: true});
        var filename   = 'key';
        var ciphertext = fs.readFileSync(filename, 'utf8');
        ciphertext     = new Buffer(ciphertext, 'base64');
        var key        = new Buffer(passphrase);
        var decrypt    = triplesec.decrypt;

        decrypt({
            key: key,
            data: ciphertext
        }, function(err, secret) {
            if (err) {
                return console.log(err);
            }
            parts = secret.toString('utf-8').split('#');

            github.authenticate({
                type: "basic",
                username: parts[0],
                password: parts[1]
            });
            console.log('Auhorized');
            if ('function' == typeof callback) {
                callback();
            }
        });
        return github;
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
            packagename = packagename || this.getModuleInfo().name;
            var filename = 'composer.json';
            if (fs.existsSync(filename)) {
                console.log("The " + filename + " already exists");
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
        },
        keygen: function () {
            console.log('Generate file key ');

            var username = readlineSync.question("Username : "),
            password     = readlineSync.question("Password : "),
            passphrase   = readlineSync.question("Passphrase : "),
            key          = new Buffer(passphrase),
            secret       = new Buffer(username + '#' + password),
            secret1      = new Buffer(secret),
            encrypt      = triplesec.encrypt;

            encrypt({
                key: key,
                data: secret1
            }, function(err, ciphertext) {
                var ciphertext = ciphertext.toString('base64');
                console.log(ciphertext);
                var filename = 'key';
                fs.writeFile(filename, ciphertext);
            });
        },
        createReleaseDraft: function () {

            var github = getGithub(function(){

                var merg = ' -> ';
                var version = tm.getModuleInfo().version;
                console.log(merg + 'composer.json version ' + version);

                console.log(merg + 'List exist releases');
                github.releases.listReleases({
                    owner: 'tmhub',
                    repo: 'askit'
                }, function(err, releases){
                    // console.log(releases);
                    var id = false;
                    for (var i in releases) {
                        if ('undefined' == typeof releases[i].tag_name) {
                            continue;
                        }
                        // console.log(res[i].id);
                        console.log('    * ' + releases[i].tag_name);
                        if (releases[i].tag_name == version) {
                            id = releases[i].id;
                        }
                    }
                    console.log(merg + 'Current Tag : ' + version);

                    if (false !== id) {
                        console.log(merg + 'Release was exists (id : ' + id + ')');
                    }

                    var question = "Do you want create release draft on " + version + " tag ? (type yes) ";
                    var answer = readlineSync.question(question);
                    if (answer.match(/^y(es)?$/i)) {
                        var cmd = 'git log HEAD...`git describe --abbrev=0 --tags` --pretty="* %h %s"';
                        exec(cmd, function (err, stdout, stderr) {
                            console.log(stdout);
                            var body = stdout;
                            // console.log(stderr);
                            // cb(err);
                            github.releases.createRelease({
                                owner: 'tmhub',
                                repo: 'askit',
                                tag_name: version,
                                name: 'Version ' + version,
                                body: body,
                                draft: true,
                                prerelease: true
                            }, function(err, res){
                                console.log(res);
                                id = res.id
                            });
                        });
                    }

                    // github.releases.getRelease({
                    //     owner: 'tmhub',
                    //     repo: 'askit',
                    //     id: id
                    // }, function(err, res){
                    //     console.log(res)
                    //     // console.log(JSON.stringify(res));
                    //     // console.log(res.length);
                    //     // console.log(res[0].id);
                    //     // console.log(res[1].id);
                    // });

                    // github.releases.listAssets({
                    //     owner: 'tmhub',
                    //     repo: 'askit',
                    //     id: id
                    // }, function(err, res){
                    //     // console.log(JSON.stringify(res));
                    //     // console.log(res);
                    //     var isUpload = false;
                    //     for (var i in res) {
                    //         if (res[i].name == tm.getArchiveName()) {
                    //             isUpload = true;
                    //         }
                    //     }

                    //     console.log(tm.getArchiveName() + ' is ' + (isUpload ? '' : ' not ') + ' exist');
                    // });
                    //
                    // console.log('github.releases.uploadAssets');
                    // console.log(github.releases.uploadAssets);
                });
            });
        }
    };
}());