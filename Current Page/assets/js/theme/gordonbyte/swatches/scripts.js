import utils from '@bigcommerce/stencil-utils';

export default class Swatches{

  constructor(){
    var product = $('.card');
    var product_count = $('.card').length;
    var allIds = [];
    var finalIds = [];
    var token = jQuery('#header').data('apitok');

    product.each((i,e) => {

      var prodID = $(e).data("gbproduct-id");
      allIds.push(prodID);

      finalIds = allIds.filter(function(elem, index, self) {
          return index === self.indexOf(elem);
      });

    });

    this.getOptions(token, finalIds, product_count);
  }


  getOptions(t, f, c){
    var productSwatch = [];


    fetch('/graphql',{
      method: 'POST',
      credentials: 'include',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + t
      },
      body: JSON.stringify({
        query: `
        query SeveralProductsByID {
        site {
          products(first: ${c}, entityIds: [${f}]) {
            edges {
              node {
                entityId
                name
                productOptions {
                  edges {
                    node {
                      entityId
                      displayName
                      isRequired
                      ... on CheckboxOption {
                        checkedByDefault
                      }
                      ... on MultipleChoiceOption {
                        values {
                          edges {
                            node {
                              ... on SwatchOptionValue {
                                hexColors
                                imageUrl(width: 200)
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
              }
            }
          }
        }`
      })
    }).then(res => res.json()).then(data => {

      var productArray = data.data.site.products.edges;

      productArray.forEach((productItem, i) => { //Loop through each product
        var productOptions = productItem.node.productOptions.edges;
        var productID = productItem.node.entityId;
        productSwatch[productID] = [];

        if(productOptions.length > 0){    //Check if product options exist

          productOptions.forEach((options, x) => { // Loop through each individual option

            if(options.node.values){  //Remove/filter out options with no selectable values (ex. custom fields etc)

              options.node.values.edges.forEach((items, n) => { // Loop through each product option selectable choices

                if(Object.keys(items.node).length > 0){ // Filter/remove options that does not have hexColors or imageUrl

                  productSwatch[productID].push([items.node.hexColors, items.node.imageUrl]);


                }
              });
            }
          });
        }
      });

      this.colorSwatchSetUp(productSwatch);

    }).catch((error) => {
      console.log(error);
      console.log("Failing");
    });
  }

	colorSwatchSetUp(ps){
		let max_swatchs;
		if ($('.swatch_size__xlarge')[0]) {
			max_swatchs = 3
		} else {
			max_swatchs = 4
		}
		ps.forEach((item, i) => {
			let total = item.length;
			const cardSwatchElements = $('.card[data-gbproduct-id="' + i + '"] .card-swatch');
			item.forEach((ite, r) => {
				let swatch;
				if (r < max_swatchs) {
					swatch = $('<div/>').addClass('form-option-wrapper');
					if (ite[1]) {
						var label = $('<label/>').addClass('form-option form-option-swatch gb-swatch-pattern');
						var span = $('<span/>').addClass('form-option-variant form-option-variant--pattern');
						span.attr('style', 'background-image: url(' + ite[1] + ')');
						label.append(span);
					} else {
						var label = $('<label/>').addClass('form-option form-option-swatch');
						for(var n = 0; n < ite[0].length; n++) {
							var span = $('<span/>').addClass('form-option-variant form-option-variant--color');
							span.css('background-color', ite[0][n]);
							label.append(span);
						}
					}
					swatch.append(label);
					cardSwatchElements.append(swatch);
				} else if (r == max_swatchs) {
					total -= max_swatchs;
					swatch = $('<span class="swatch-total">+' + total + '</span>');
					cardSwatchElements.append(swatch);
					return;
				}
			});
		});
	}
} //Class ends
