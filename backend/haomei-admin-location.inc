location = /ops/haomei { return 302 /ops/haomei/admin/; }
location ^~ /ops/haomei/ {
 proxy_pass http://127.0.0.1:18966;
 proxy_set_header Host $host;
 proxy_set_header X-Real-IP $remote_addr;
 proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
 proxy_set_header X-Forwarded-Proto $scheme;
 proxy_read_timeout 30s;
 client_max_body_size 5m;
 add_header X-Robots-Tag "noindex, nofollow, noarchive" always;
 add_header Referrer-Policy "no-referrer" always;
 add_header X-Content-Type-Options "nosniff" always;
 add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'" always;
}
