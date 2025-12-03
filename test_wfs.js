const http = require('http');

const url = "http://localhost:3000/api/vworld/wfs?typeName=lp_pa_cbnd_bubun&cql_filter=pnu='4113511000105320000'";

http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Body:', data);
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
