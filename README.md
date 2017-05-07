# JS FastCGI Server
A FastCGI server that allows you to run node/javascript server-side

It's currently in very early stages and loosely inspired by [CGI-Node](https://github.com/UeiRicho/cgi-node)

## Dependencies
[node-fastcgi](https://github.com/fbbdev/node-fastcgi)
[multiparty](https://github.com/pillarjs/multiparty)

## Usage
Install dependencies using `npm install` or `yarn add` then start the server using `npm start` or `yarn start`

Now all you have to do is configure your webserver (apache/nginx/caddy) to use the FastCGI server and you're good to go

Apache example (requires mod_fastcgi)
```
<VirtualHost 127.0.0.1:80>
    ServerAdmin root@host
    DocumentRoot /var/www/example
    AddHandler jss-fastcgi .jss
    FastCgiExternalServer /var/www/example -host 127.0.0.1:9001
</VirtualHost>
```

Nginx example
```
location ~ [^/]\.jss(/|$) {
    fastcgi_split_path_info ^(.+?\.jss)(/.*)$;
    if (!-f $document_root$fastcgi_script_name) {
        return 404;
    }

    fastcgi_param HTTP_PROXY "";

    fastcgi_pass 127.0.0.1:9001;
    fastcgi_index index.jss;
    include fastcgi_params;
}
```

Caddyfile example
```
127.0.0.1:80 {
  root /var/www/example
  fastcgi / 127.0.0.1:9001 {
    ext .jss
    split .jss
    index index.jss
  }
}
```

## Code example
index.jss
```js
Hello <?js=request.server['remote_addr']?>,<br />
Here is your user-agent:<?js=request.headers.user_agent?>. <br />
Let me count to 10 for you:<br />
<?js for(var i = 1; i <= 10; i++) { write(i + ' '); } ?>
```

## Features
| js-fastcgi        | PHP           |
| ------------- |:-------------:|
|  write()      | echo |
| include()     | include      |
| response.header() | header()      |
| request.server | $_SERVER |
| request.query | $_GET |
| request.post.form | $_POST |
| request.post.files | $_FILES |
| request.cookies | $_COOKIES |