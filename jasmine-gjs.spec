Name: jasmine-gjs
Version: 2.2.0
Release: 1%{?dist}
Summary: A behavior-driven development framework for GJS

License: MIT
URL: https://github.com/ptomato/jasmine-gjs
Source0: http://ptomato.name/downloads/jasmine-gjs-2.2.0.tar.xz

BuildArch: noarch
BuildRequires: gjs >= 1.40
BuildRequires: gobject-introspection
Requires: gjs >= 1.40
Requires: gobject-introspection

%description
This module allows you to run Jasmine specs for your GJS code. The output will
be displayed in your terminal.

%prep
%autosetup


%build
%configure
make %{?_smp_mflags}


%install
rm -rf $RPM_BUILD_ROOT
%make_install


%check
make check


%clean
rm -rf $RPM_BUILD_ROOT


%files
%doc README.md
%doc NEWS.md
%doc COPYING
%doc %{_mandir}/man1/jasmine.1.gz
%{_bindir}/jasmine
%{_datadir}/%{name}/


%changelog
* Sun May 17 2015 Philip Chimento <philip.chimento@gmail.com> - 2.2.0-1
- Update to version 2.2.0.
* Wed Mar 4 2015 Philip Chimento <philip.chimento@gmail.com> - 2.1.3-1
- Initial packaging.
