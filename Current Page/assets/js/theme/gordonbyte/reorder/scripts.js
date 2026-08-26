export default function () {

	const rearrangeDivSections = (orderString) => {
		const divContainer = document.getElementById('main-container');
		const divs = Array.from(divContainer.children);

		const orderArray = orderString.split('|').map(Number);

		const sortedDivs = [];
		for (const order of orderArray) {
		const div = divs.find(div => Number(div.dataset.order) === order);
			if (div) {
				sortedDivs.push(div);
			}
		}

		divContainer.innerHTML = ''; // Clear the container

		for (const div of sortedDivs) {
			divContainer.appendChild(div); // Append the divs in the new order
			}
		};
	
	// Example usage:
	const orderString = $("#main-container").data("sections");
	rearrangeDivSections(orderString);

}
