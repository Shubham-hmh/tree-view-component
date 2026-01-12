#!/bin/bash
# Post-build script to ensure proper MIME types

# Create web.config for servers that support it
cat > dist/web.config << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <staticContent>
      <mimeMap fileExtension=".js" mimeType="application/javascript; charset=utf-8" />
      <mimeMap fileExtension=".mjs" mimeType="application/javascript; charset=utf-8" />
      <mimeMap fileExtension=".css" mimeType="text/css; charset=utf-8" />
      <mimeMap fileExtension=".json" mimeType="application/json; charset=utf-8" />
    </staticContent>
    <rewrite>
      <rules>
        <rule name="Handle Angular SPA" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
EOF

# Create .htaccess for Apache servers
cat > dist/.htaccess << 'EOF'
RewriteEngine On

# Handle SPA routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Set MIME types
<FilesMatch "\\.js$">
    Header set Content-Type "application/javascript; charset=utf-8"
</FilesMatch>

<FilesMatch "\\.mjs$">
    Header set Content-Type "application/javascript; charset=utf-8"
</FilesMatch>

<FilesMatch "\\.css$">
    Header set Content-Type "text/css; charset=utf-8"
</FilesMatch>
EOF

echo "Post-build configuration files created"