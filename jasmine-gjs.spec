Name: jasmine-gjs
Version: 2.1.3
Release: 1%{?dist}
Summary: A behavior-driven development framework for GJS

License: MIT
URL: https://github.com/ptomato/jasmine-gjs
Source0: http://ptomato.name/downloads/jasmine-gjs-2.1.3.tar.xz

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
%doc COPYING
%{_bindir}/jasmine
%{_datadir}/%{name}/


%changelog
* Fri Feb 27 2015 Philip Chimento <philip.chimento@gmail.com> - 2.1.3-1
- Initial packaging.
