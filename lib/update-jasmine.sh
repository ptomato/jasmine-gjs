# This script is used to build our custom version of the Jasmine library by
# downloading the upstream file and applying our patches, and is meant for use
# only when upgrading to a new upstream version.
curl -o jasmine.js https://raw.githubusercontent.com/jasmine/jasmine/v3.10.1/lib/jasmine-core/jasmine.js
# patch <local-modifications.patch jasmine.js
