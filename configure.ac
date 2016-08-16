AC_INIT([Jasmine GJS], [2.2.1])
AM_INIT_AUTOMAKE([1.11 -Wall foreign dist-xz no-dist-gzip parallel-tests])
AC_CONFIG_MACRO_DIR([m4])
AM_SILENT_RULES([yes])

# Check for programs we need during build

AC_PROG_AWK
AC_REQUIRE_AUX_FILE([tap-driver.sh])
AC_PROG_MKDIR_P
AX_PROG_GJS

# Output build system

AC_CONFIG_FILES([Makefile])
AC_OUTPUT
