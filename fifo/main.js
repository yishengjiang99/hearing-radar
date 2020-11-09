var importObject = { imports: [fifo_init] };

fetch("../out/main.wasm")
	.then((response) => response.arrayBuffer())
	.then((bytes) => WebAssembly.instantiate(bytes, importObject))
	.then(({ instance, module }) => {
		console.log(results);
		document.getElementById(
			"container"
		).textContent = instance.exports.main();
	})
	.catch(console.error);
