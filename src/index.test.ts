// import { expect } from "chai";

// describe("index.ts", () => {
// 	it("written in typescript", () => {
// 		window.requestFileSystem =
// 			window.requestFileSystem || window.webkitRequestFileSystem;
// 		window.directoryEntry =
// 			window.directoryEntry || window.webkitDirectoryEntry;

// 		function onFs(fs) {
// 			fs.root.getDirectory(
// 				"Documents",
// 				{ create: true },
// 				function (directoryEntry) {
// 					//directoryEntry.isFile === false
// 					//directoryEntry.isDirectory === true
// 					//directoryEntry.name === 'Documents'
// 					//directoryEntry.fullPath === '/Documents'
// 				},
// 				function (err) {
// 					alert(err);
// 				}
// 			);
// 		}

// 		// Opening a file system with temporary storage
// 		window.requestFileSystem(1, 1024 * 1024 /*1MB*/, onFs, console.error);
// 	});
// });
//
