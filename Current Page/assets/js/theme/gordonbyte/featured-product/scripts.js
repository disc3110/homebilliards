import utils from '@bigcommerce/stencil-utils';

const template = 'pages/home';

export default class FeaturedProduct{
  constructor(){
    this.prodID = $('.highlight-product').data('highlightid');
    this.img;
    this.name;
    this.prices;
    // this.rating;
    this.social;
    this.header;
    this.url;

  }

  request(){
    
    
	if($('.homepage')[0]){
    utils.api.product.getById(this.prodID, template, (err, resp) => {

      this.img = $(resp).find('.productView-img-container a img').attr('src');
      this.name = $(resp).find('.productView-product .productView-title').text();
      this.prices = $(resp).find('.productView-product .productView-price');
      // this.rating = $(resp).find('.productView-product .productView-rating');
      this.social = $(resp).find('.productView-details .socialLinks');
      this.url = $(resp).find('.productView-details .socialLinks');
      
      this.display(this.name, this.prices, this.img, this.social, this.prodID);

    });
  }

  }//request ends

  display(n, p, i, s, id){
    
    if($('.highlight-product .highlight-info h2').length > 0){
      $('.highlight-product .highlight-info h2').append(n);
    }

    // if($('.highlight-product .highlight-rating').length > 0){
    //   $('.highlight-product .highlight-rating').append(r);
    // }

    if($('.highlight-product .highlight-price').length > 0){
      $('.highlight-product .highlight-price').append(p);
    }

    if($('.highlight-product .highight-img img').length > 0){
      $('.highlight-product .highight-img img').attr('src', i);
    }

    if($('.highlight-product .highlight-social').length > 0){
      $('.highlight-product .highlight-social').append(s);
    }

    $('.highight-atc a').attr('href', '/products.php?productId=' + id);


  }//display ends

}//individualProduct ends

