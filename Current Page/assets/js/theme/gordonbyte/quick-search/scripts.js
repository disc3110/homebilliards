import _ from 'lodash';
import utils from '@bigcommerce/stencil-utils';
import StencilDropDown from '../../global/stencil-dropdown';

export default function () {
    const TOP_STYLING = 'top: 49px;';
    const $quickSearchResults = $('.quickSearchResults');
    const $quickSearchForms = $('[data-quick-search-form]');
    const $quickSearchExpand = $('#quick-search-expand');
    const $searchQuery = $quickSearchForms.find('[data-search-quick]');
    const stencilDropDownExtendables = {
        hide: () => {
            $quickSearchExpand.attr('aria-expanded', false);
            $searchQuery.trigger('blur');
            $('.quickSearchResults').removeClass('searchResultsOpen');
        },
        show: (event) => {
            $quickSearchExpand.attr('aria-expanded', true);
            $searchQuery.trigger('focus');
            event.stopPropagation();
            $('.quickSearchResults').addClass('searchResultsOpen');
        },
    };
    const stencilDropDown = new StencilDropDown(stencilDropDownExtendables);
    stencilDropDown.bind($('#custom_quicksearch'), $('#quickSearch'), TOP_STYLING);

    $("#quick-search-expand").on("click", function(){
        $("#custom_quicksearch").submit();
    });
    
    if($("#quickSearch")[0]){
        $('.navUser-action--quickSearch, .closeSearch-btn').on('click', () => {
            console.log("clicked");
            $('#quickSearch').toggleClass("quickSearch-active");
            $('body').toggleClass("scroll-lock");
        });
    }

    stencilDropDownExtendables.onBodyClick = (e, $container) => {
        // If the target element has this data tag or one of it's parents, do not close the search results
        // We have to specify `.modal-background` because of limitations around Foundation Reveal not allowing
        // any modification to the background element.
        if ($(e.target).closest('[data-prevent-quick-search-close], .modal-background').length === 0) {
            stencilDropDown.hide($container);

            if ($searchQuery.val().length === 0) {
                $('.quickSearchResults').empty();
            }
        }
    };

    // stagger searching for 200ms after last input
    const debounceWaitTime = 200;
    const doSearch = _.debounce((searchQuery) => {
        utils.api.search.search(searchQuery, { template: 'search/quick-results' }, (err, response) => {
            if (err) {
                return false;
            }

            $('.quickSearchResults').empty();

            let ul, li, a, img, name, main;

            main = $("<div/>");
            ul = $("<ul/>");
            main.addClass("searchproduct-holder searchproduct-result");
            //$quickSearchResults.html(response);

            let resp = $(response).find("li.product");
            let resplength = resp.length;

            $(resp).each((i,e) =>{

              li = $("<li/>");
              a = $("<a/>");
              img = $("<div/>");
              name = $("<div/>");
              li.addClass("searchproduct-list");
              img.addClass("searchproduct-img");
              name.addClass("searchproduct-name");
              img.append($(e).find('.card-img-container img'));
              name.append($(e).find('.card-title a'));

              li.append(a);
              a.append(img);
              a.append(name);
              ul.append(li);
            });
            main.append(ul);

            $quickSearchResults.append("<h3>" + resplength + " results</h3>");
            $quickSearchResults.append(main);

            // $quickSearchResults.html(response);
            // const $quickSearchResultsCurrent = $quickSearchResults.filter(':visible');

            // const $noResultsMessage = $quickSearchResultsCurrent.find('.quickSearchMessage');
            // if ($noResultsMessage.length) {
            //     $noResultsMessage.attr({
            //         role: 'status',
            //         'aria-live': 'polite',
            //     });
            // } else {
            //     const $quickSearchAriaMessage = $quickSearchResultsCurrent.next();
            //     $quickSearchAriaMessage.addClass('u-hidden');

            //     const predefinedText = $quickSearchAriaMessage.data('search-aria-message-predefined-text');
            //     const itemsFoundCount = $quickSearchResultsCurrent.find('.product').length;

            //     $quickSearchAriaMessage.text(`${itemsFoundCount} ${predefinedText} ${searchQuery}`);

            //     setTimeout(() => {
            //         $quickSearchAriaMessage.removeClass('u-hidden');
            //     }, 100);
            // }
        });
    }, debounceWaitTime);

    utils.hooks.on('search-quick', (event, currentTarget) => {
        const searchQuery = $(currentTarget).val();

        // server will only perform search with at least 3 characters
        if (searchQuery.length < 3) {
            return;
        }

        doSearch(searchQuery);
    });

    // Catch the submission of the quick-search forms
    $quickSearchForms.on('submit', event => {
        event.preventDefault();

        const $target = $(event.currentTarget);
        const searchQuery = $target.find('input').val();
        const searchUrl = $target.data('url');

        if (searchQuery.length === 0) {
            return;
        }

        window.location.href = `${searchUrl}?search_query=${encodeURIComponent(searchQuery)}`;
    });

}
