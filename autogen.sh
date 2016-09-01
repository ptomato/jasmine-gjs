#!/bin/sh
# Run this to generate all the initial makefiles, etc.

srcdir=`dirname $0`
test -z "$srcdir" && srcdir=.
olddir=`pwd`

cd "$srcdir"
autoreconf -if || exit $?
cd "$olddir"

if test "$#" = 0 -a "x$NOCONFIGURE" = "x"; then
  echo "**Warning**: I am going to run 'configure' with no arguments."
  echo "If you wish to pass any to it, please specify them on the"
  echo \'$0\'" command line."
  echo
fi

if test "x$NOCONFIGURE" = "x"; then
    echo Running "$srcdir/configure" "$@" ...
    "$srcdir/configure" "$@" \
    && echo "Now type 'make' to compile" || exit 1
else
    echo Skipping configure process.
fi
