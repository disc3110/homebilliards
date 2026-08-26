import Swatches from './swatches/scripts';
import FeaturedProduct from './featured-product/scripts';
import Instagram from './instagram/scripts';
import Reorder from './reorder/scripts';


export default function(){
	Instagram();
	Reorder();
}

const swatches = new Swatches();

const featuredProduct = new FeaturedProduct();
featuredProduct.request();

addEventListener("DOMContentLoaded", (event) => {
	setMobileTable('table');
});

addEventListener("resize", (event) => {
	setMobileTable('table');
});

window.setMobileTable = function(selector) {
	if (window.innerWidth > 600) return false;
	const tableEls = document.querySelectorAll(selector);
	tableEls.forEach(tableEl => {
		const thEls = tableEl.querySelectorAll('thead td');
		const tdLabels = Array.from(thEls).map(el => el.innerText);
		tableEl.querySelectorAll('tbody tr').forEach(tr => {
			Array.from(tr.children).forEach(
				(td, ndx) =>  td.setAttribute('data-label', tdLabels[ndx])
			);
		});
	});
}
