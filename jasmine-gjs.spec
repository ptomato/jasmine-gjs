Name: jasmine-gjs
Version: 3.10.1
Release: 1%{?dist}
Summary: A behavior-driven development framework for GJS

License: MIT
URL: https://github.com/ptomato/jasmine-gjs
Source0: https://github.com/ptomato/jasmine-gjs/releases/download/3.10.1/jasmine-gjs-3.10.1.tar.xz

BuildArch: noarch
BuildRequires: gjs >= 1.71.1
BuildRequires: gobject-introspection
BuildRequires: meson >= 0.58.0
Requires: gjs >= 1.71.1
Requires: gobject-introspection

%description
This module allows you to run Jasmine specs for your GJS code. The output will
be displayed in your terminal.

%prep
%autosetup


%build
%meson
%meson_build


%install
%meson_install


%check
%meson_test


%files
%doc README.md
%doc NEWS.md
%doc COPYING
%doc %{_mandir}/man1/jasmine.1.gz
%{_bindir}/jasmine
%{_libexecdir}/%{name}/
%{_datadir}/%{name}/


%changelog
* Sun Jul 14 2024 Philip Chimento <philip.chimento@gmail.com> - 3.10.1-1
- Update requirements for version 3.10.1.
* Thu Sep 10 2020 Andy Holmes <andrew.g.r.holmes@gmail.com> - 2.6.4-1
- Update to version 2.6.4.
* Fri Sep 4 2020 Andy Holmes <andrew.g.r.holmes@gmail.com> - 2.5.2-1
- Update to version 2.5.2.
* Sat Aug 29 2020 Andy Holmes <andrew.g.r.holmes@gmail.com> - 2.4.1-1
- Update to version 2.4.1.
* Wed Aug 26 2020 Andy Holmes <andrew.g.r.holmes@gmail.com> - 2.3.4-1
- Update to version 2.3.4.
* Mon Aug 24 2020 Philip Chimento <philip.chimento@gmail.com> - 2.3.0-1
- Update to version 2.3.0.
* Tue Jun 30 2015 Philip Chimento <philip.chimento@gmail.com> - 2.2.1-1
- Update to version 2.2.1.
* Sun May 17 2015 Philip Chimento <philip.chimento@gmail.com> - 2.2.0-1
- Update to version 2.2.0.
* Wed Mar 4 2015 Philip Chimento <philip.chimento@gmail.com> - 2.1.3-1
- Initial packaging.
