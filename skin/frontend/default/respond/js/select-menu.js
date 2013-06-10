(function($j){
	
	//plugin's default options
	var settings = {
		combine: true,					//combine multiple menus into a single select
		groupPageText: 'All In This Category',			//optgroup's aren't selectable, make an option for it
		nested: true,					//create optgroups by default
		prependTo: '.nav-container',				//insert at top of page by default
		switchWidth: 751,				//width at which to switch to select, and back again
		topOptionText: 'SHOP CATEGORIES'	//default "unselected" state
	},
	
	//used to store original matched menus
	$jmenus,
	
	//used as a unique index for each menu if no ID exists
	menuCount = 0,
	
	//used to store unique list items for combining lists
	uniqueLinks = [];


	//go to page
	function goTo(url){
		document.location.href = url;
	}
	
	//does menu exist?
	function menuExists(){
		return ($j('.mnav').length) ? true : false;
	}

	//validate selector's matched list(s)
	function isList($jthis){
		var pass = true;
		$jthis.each(function(){
			if(!$j(this).is('ul') && !$j(this).is('ol')){
				pass=false;
			}
		});
		return pass;
	}//isList()


	//function to decide if mobile or not
	function isMobile(){
		return ($j(window).width() < settings.switchWidth);
	}
	
	
	//function to get text value of element, but not it's children
	function getText($jitem){
		return $j.trim($jitem.clone().children('ul, ol').remove().end().text());
	}
	
	//function to check if URL is unique
	function isUrlUnique(url){
		return ($j.inArray(url, uniqueLinks) === -1) ? true : false;
	}
	
	
	//function to do duplicate checking for combined list
	function checkForDuplicates($jmenu){
		
		$jmenu.find(' > li').each(function(){
		
			var $jli = $j(this),
				link = $jli.find('a').attr('href'),
				parentLink = function(){
					if($jli.parent().parent().is('li')){
						return $jli.parent().parent().find('a').attr('href');
					} else {
						return null;
					}
				};
						
			//check nested <li>s before checking current one
			if($jli.find(' ul, ol').length){
				checkForDuplicates($jli.find('> ul, > ol'));
			}
		
			//remove empty UL's if any are left by LI removals
			if(!$jli.find(' > ul li, > ol li').length){
				$jli.find('ul, ol').remove();
			}
		
			//if parent <li> has a link, and it's not unique, append current <li> to the "unique parent" detected earlier
			if(!isUrlUnique(parentLink(), uniqueLinks) && isUrlUnique(link, uniqueLinks)){
				$jli.appendTo(
					$jmenu.closest('ul#mmnav').find('li:has(a[href='+parentLink()+']):first ul')
				);
			}
			
			//otherwise, check if the current <li> is unique, if it is, add it to the unique list
			else if(isUrlUnique(link)){
				uniqueLinks.push(link);
			}
			
			//if it isn't, remove it. Simples.
			else{
				$jli.remove();
			}
		
		});
	}
	
	
	//function to combine lists into one
	function combineLists(){
		
		//create a new list
		var $jmenu = $j('<ul id="mmnav" />');
		
		//loop through each menu and extract the list's child items
		//then append them to the new list
		$jmenus.each(function(){
			$j(this).children().clone().appendTo($jmenu);
		});
		
		//de-duplicate any repeated items
		checkForDuplicates($jmenu);
				
		//return new combined list
		return $jmenu;
		
	}//combineLists()
	
	
	
	//function to create options in the select menu
	function createOption($jitem, $jcontainer, text){
		
		//if no text param is passed, use list item's text, otherwise use settings.groupPageText
		if(!text){
			$j('<option value="'+$jitem.find('a:first').attr('href')+'">'+$j.trim(getText($jitem))+'</option>').appendTo($jcontainer);
		} else {
			$j('<option value="'+$jitem.find('a:first').attr('href')+'">'+text+'</option>').appendTo($jcontainer);
		}
	
	}//createOption()
	
	
	
	//function to create option groups
	function createOptionGroup($jgroup, $jcontainer){
		
		//create <optgroup> for sub-nav items
		var $joptgroup = $j('<optgroup label="'+$j.trim(getText($jgroup))+'" />');
		
		//append top option to it (current list item's text)
		createOption($jgroup,$joptgroup, settings.groupPageText);
	
		//loop through each sub-nav list
		$jgroup.children('ul, ol').each(function(){
		
			//loop through each list item and create an <option> for it
			$j(this).children('li').each(function(){
				createOption($j(this), $joptgroup);
			});
		});
		
		//append to select element
		$joptgroup.appendTo($jcontainer);
		
	}//createOptionGroup()

	
	
	//function to create <select> menu
	function createSelect($jmenu){
	
		//create <select> to insert into the page
		var $jselect = $j('<select id="mm'+menuCount+'" class="mnav" />');
		menuCount++;
		
		//create default option if the text is set (set to null for no option)
		if(settings.topOptionText){
			createOption($j('<li>'+settings.topOptionText+'</li>'), $jselect);
		}
		
		//loop through first list items
		$jmenu.children('li').each(function(){
		
			var $jli = $j(this);

			//if nested select is wanted, and has sub-nav, add optgroup element with child options
			if($jli.children('ul, ol').length && settings.nested){
				createOptionGroup($jli, $jselect);
			}
			
			//otherwise it's a single level select menu, so build option
			else {
				createOption($jli, $jselect);			
			}
						
		});
		
		//add change event and prepend menu to set element
		$jselect
			.change(function(){goTo($j(this).val());})
			.prependTo(settings.prependTo);
	
	}//createSelect()

	
	//function to run plugin functionality
	function runPlugin(){
	
		//menu doesn't exist
		if(isMobile() && !menuExists()){
			
			//if user wants to combine menus, create a single <select>
			if(settings.combine){
				var $jmenu = combineLists();
				createSelect($jmenu);
			}
			
			//otherwise, create a select for each matched list
			else{
				$jmenus.each(function(){
					createSelect($j(this));
				});
			}
		}
		
		//menu exists, and browser is mobile width
		if(isMobile() && menuExists()){
			$j('.mnav').show();
			$jmenus.hide();
		}
			
		//otherwise, hide the mobile menu
		if(!isMobile() && menuExists()){
			$j('.mnav').hide();
			$jmenus.show();
		}
		
	}//runPlugin()

	
	
	//plugin definition
	$j.fn.mobileMenu = function(options){

		//override the default settings if user provides some
		if(options){$j.extend(settings, options);}
		
		//check if user has run the plugin against list element(s)
		if(isList($j(this))){
			$jmenus = $j(this);
			runPlugin();
			$j(window).resize(function(){runPlugin();});
		} else {
			alert('mobileMenu only works with <ul>/<ol>');
		}
				
	};//mobileMenu()
	
})(jQuery);
