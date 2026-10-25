# Cookie

A visit counter kept in a signed cookie through a typed `CookieStore`.

Run it with:

```sh
cargo hearth dev -p cookie
```

The example generates a new signing key on every start, so restarting the server invalidates the cookie and resets the counter.
