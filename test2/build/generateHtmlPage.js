const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const marked = require('marked')
const log = require('./log')
const hljs = require('highlight.js')
const getFilepathNeighbours = require('./getFilepathNeighbours');
const getPrevPath = require('./getPrevPath');

marked.setOptions({
	highlight: function (code) {
		return hljs.highlightAuto(code).value;
	}
});

const generateHtmlpage = async function (templateData, filepath) {

	const links = await getFilepathNeighbours(filepath)
	const backlink = await path.normalize(getPrevPath(filepath.path))
	const title = path.parse(filepath.path).name

	templateData = {
		links: { next: links.next, prev: links.prev },
		backlink: backlink,
		title: title
	}


	// get the page content from the js file by requiring the modules template
	let templatePath = await require(filepath.fullPath).template
	if (templatePath == null) templatePath = "./templates/template.ejs"

	// get the templateFile for this route
	const templateFile = await fs.readFileSync(path.resolve(process.cwd(), templatePath), "utf-8")

	// get the page content from the js file by requiring the modules page
	templateData.content = await require(filepath.fullPath).page

	// get the target (if any) from the js file by requiring the modules target
	// .target referrers to the online content that this page wants to pull
	templateData.target = await require(filepath.fullPath).target
	// templateData.target = "null"
	// console.log(templateData.target)

	// Fetch content from github if the page exported any target link
	if (templateData.target != null) {
		let data = '';
		const count = templateData.target.length
		
		for(let i = 0; i < count; i ++) {
			const response = await fetch(templateData.target[i]);
			const result = await response.text();
			data = await data + result
		}
		// const count = templateData.count
		// await templateData.target.forEach(async (url) => {
		// 	const response = await fetch(url);
		// 	const result = await response.text();
		// 	data = await data + result
		// 	// console.log(data)
		// })


		templateData.target = marked(data);
	} else {
		// return nothing because there was no content to load
		templateData.target = undefined
	}

	// render html from the template provided. and bake in the templateData json object
	const html = await ejs.render(templateFile, templateData)
	return (html)

}

module.exports = generateHtmlpage

// Fetching content from github can be done like this
// const response = await fetch('https://github.com/');
// const data = await response.text();
// console.log(data); 