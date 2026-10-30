/**
 * Rule the words! KKuTu Online
 * Copyright (C) 2017 JJoriping(op@jjo.kr)
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

$(document).ready(function(){
	// 목차 항목의 id는 help.pug에 직접 적는다 (li#c4p57 → div.page-body#box-c4p57).
	// 예전처럼 위치로 번호를 매기면 중간에 항목을 넣을 때 뒤쪽 페이지 번호가 전부 밀린다
	$("#list li").each(function(_index, obj){
		var $li = $(obj);
		var $childUl = $li.children("ul");

		if($childUl.length){
			$li.prepend("<span class='toggle-arrow'>▽</span>").addClass("collapsed");
			$li.on('click', function(e){
				$li.toggleClass("collapsed");
				e.stopPropagation();
			});
		} else {
			$li.on('click', onMenu);
		}
	});
	$("img").on('click', function(e){
		var $target = $(e.currentTarget);

		window.open($target.attr('src'), "", [
			"resizable=no", "status=no"
		].join(','));
	});

	function onMenu(e){
		$(".selected").removeClass("selected");
		var $target = $(e.currentTarget).addClass("selected");
		var id = $target.attr('id');
		var title = $target.children("label").html();
		var $tp = $target.parents("li");
		
		if($tp.length) title = $tp.children("label").html() + " > " + title;
		$("#page-head").html(title);
		$(".page-body").hide();
		$("#box-" + id).show();
		e.stopPropagation();
	}
});