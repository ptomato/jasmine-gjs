# Release Checklist #

## Updating to a new upstream release ##

- [ ] Bump version in `meson.build`.
- [ ] Change upstream Jasmine version in the `lib/update-jasmine.sh` script.
- [ ] Delete `lib/jasmine.js`.
- [ ] Run `cd lib; ./update-jasmine.sh` to regenerate `lib/jasmine.js` from the new upstream version.
- [ ] Resolve patch conflicts with the new upstream version if necessary.
- [ ] If making a new major release, update `test/jasmineIntegrationTest.js` and `test/focusedSpecIntegrationTest.js` from `https://github.com/jasmine/jasmine.github.io/tree/master/_versions/<VERSION>/src`.
      Currently we use `introduction.js`, `custom_equality.js`, `custom_matcher.js`, and `focused_specs.js`, but there may be new features that should be included as well.
      Strip the documentation comments and the weird indentation.
- [ ] If making a new major release, see if there are any new features that we can use to improve jasmine-gjs's own tests.
- [ ] Run `meson test`.
- [ ] Make a commit.
- [ ] Write release notes in `NEWS.md`.

## Packaging: RPM ##

- [ ] Update the version number in `jasmine-gjs.spec`.
- [ ] Add a changelog entry in `jasmine-gjs.spec`.
- [ ] Make any other necessary changes to `jasmine-gjs.spec`.
- [ ] Run `ninja dist`.
- [ ] Copy `jasmine-gjs-<VERSION>.tar.xz` to `rpmbuild/SOURCES`.
- [ ] Copy `jasmine-gjs.spec` to `rpmbuild/SPECS`.
- [ ] Run `rpmbuild -ba /path/to/rpmbuild/SPECS/jasmine-gjs.spec` to ensure that everything builds OK.
- [ ] Make a commit.

## Packaging: Debian ##

- [ ] Update the changelog with `dch`. (Distribution = `unstable`)
- [ ] Make any other necessary changes to the `debian` directory.
- [ ] Run `debuild -uc -us -b` to ensure that everything builds OK.
- [ ] Make a commit.
- [ ] Run `ninja dist`.
- [ ] Copy `jasmine-gjs-<VERSION>.tar.xz` to `../jasmine-gjs_<VERSION>.orig.tar.xz`.
- [ ] Extract the tarball.
- [ ] Enter the directory and run `debuild -uc -us -S` to build a source package.

## Releasing ##

- [ ] Run `git tag <VERSION>`; version is just dotted numbers, e.g. `2.2.1`, no `v` or `Version`.
- [ ] Push the tag to GitHub.
- [ ] Copy the release notes from `NEWS.md` into https://github.com/ptomato/jasmine-gjs/releases
- [ ] Attach the tarball and the sha256sum from the `meson-dist` directory to the release notes.
- [ ] Attach the RPM packages from `/path/to/rpmbuild/RPMS/` and `/path/to/rpmbuild/SRPMS` to the release notes.
- [ ] Attach the Debian packages (`jasmine-gjs_<VERSION>-1_all.deb`, `jasmine-gjs_<VERSION>.orig.tar.xz`, `jasmine-gjs_<VERSION>-1.debian.tar.xz`, and `jasmine-gjs_<VERSION>-1.dsc`) to the release notes.
