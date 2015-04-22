# node-tmhub
Our custom nodejs lib for fast gulp build writing

## Integartion

1. Open [extension]/build/package.json
2. Add "node-tmhub": "git://github.com/tmhub/node-tmhub.git#master" to dependencies
3. Open [extension]/build/gulpfile.js
4. Add the following code to require section

    ~~~js
    tm = require('node-tmhub').tmhub
~~~

5. Now your can use node-tmhub features

    ~~~js
    gulp.task('composer', function(cb) {
        tm.makeDirs(['vendor', 'code']);
        tm.generateComposerJson();
        tm.composerRefresh(cb);
    });
    gulp.task('gitpushtags', tm.gitpushtags);
    gulp.task('draft', ['gitpushtags'], function (cb){
        tm.createReleaseDraft(cb);
    });
    gulp.task('keygen', tm.keygen);
~~~