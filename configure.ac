AC_INIT([Jasmine GJS], [2.1.3])
AM_INIT_AUTOMAKE([1.11 -Wall foreign dist-xz no-dist-gzip parallel-tests])
AM_SILENT_RULES([yes])

# Check for programs we need during build

AC_PROG_MKDIR_P
PKG_PROG_PKG_CONFIG

AC_MSG_CHECKING([for GJS])
AS_IF([pkg-config --exists gjs-1.0], [AC_MSG_RESULT([yes])],
    [AC_MSG_ERROR([You need GJS to install Jasmine for GJS!])])
GJS_PATH=`pkg-config --variable=gjs_console gjs-1.0`
AC_SUBST([GJS_PATH])

# Output build system

AC_CONFIG_FILES([Makefile])
AC_OUTPUT
