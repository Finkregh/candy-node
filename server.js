var config = require(__dirname + '/config'),
	fs = require('fs'),
	http = require('http'),
	staticServer = new(require('node-static').Server)(__dirname + '/public'),
	indexFile;

// parse index file only once
fs.readFile(__dirname + '/public/index.html', 'ascii', function(err, data) {
	indexFile = data.replace('OPTIONS', JSON.stringify(config.candy));
});

http.createServer(function (request, response) {
	
	// http-bind proxy
	if(request.url === '/http-bind/') {
		var proxy_req = http.request({
			host: config.http_bind.host,
			port: config.http_bind.port,
			path: config.http_bind.path,
			method: request.method
		});
		proxy_req.on('response', function(proxy_response) {
			proxy_response.on('data', function(chunk) {
				response.write(chunk, 'binary');
			});
			proxy_req.on('end', function() {
				response.end();
			});
			response.writeHead(proxy_response.statusCode, proxy_response.headers);
		});
		request.on('data', function(chunk) {
			proxy_req.write(chunk, 'binary');
		});
		request.on('end', function() {
			proxy_req.end();
		});
	
	// static files
	} else {	
		request.on('end', function() {
			if(request.url === '/' || request.url === '/index.html') {
				response.write(indexFile, 'ascii');
				response.end();
			} else {
				staticServer.serve(request, response);
			}
		});		
	}
	
}).listen(config.app.port);
