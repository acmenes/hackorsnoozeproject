"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

// function to create a new story

// https://hack-or-snooze-v3.herokuapp.com/stories

async function submitNewStory(evt) {
  console.debug("submitnewstory", evt)
  evt.preventDefault();

  //the information should come from the html form

  const title = $("#create-title").val()
  const url = $("#create-url").val()
  const author = $("#create-author").val()
  const username = currentUser.username
  const storyData = { title, url, author, username }

  const $story = await storyList.addStory(currentUser, storyData)
  $allStoriesList.prepend($story)

  $submitForm.slideUp("slow");
  $submitForm.trigger("reset");
}

$submitForm.on("submit", submitNewStory)

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showDeleteBtn = false) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  const showStar = Boolean(currentUser);

  return $(`
      <li id="${story.storyId}">
      ${showDeleteBtn ? getDeleteBtnHTML() : ""}
      ${showStar ? getStarHTML(story, currentUser) : ""}
      <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

// these two lines are causing my code to flip out

function getDeleteBtnHTML() {
  return `
      <span class="trash-can">
        <i class="fas fa-trash-alt"></i>
      </span>`;
}

function getStarHTML(story, user) {
  const isFavorite = user.isFavorite(story);
  const starType = isFavorite ? "fas" : "far";
  return `
      <span class="star">
        <i class="${starType} fa-star"></i>
      </span>`;
}


/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
  // add code to toggle favorites here 
}

function putUserStoriesOnPage() {
  console.debug("putUserStoriesOnPage");

  $ownStories.empty();

  if (currentUser.ownStories.length === 0) {
    $ownStories.append("<p>No stories added by user</p>")
  } else if (currentUser.ownStories.length >= 1) {
    for (let story of currentUser.ownStories) {
      console.log("story here")
      let $story = generateStoryMarkup(story, true)
      $ownStories.append($story)
    }
  }
  $ownStories.show();
}

function putFavoritesListOnPage() {
  console.debug("putFavoritesListOnPage")

  $favoritedStories.empty();

  if (currentUser.favorites.length === 0) {
    $favoritedStories.append("<p>No favorited stories!</p>")
  } else {
    for (let story of currentUser.favorites) {
      console.log("story")
      let $story = generateStoryMarkup(story)
      $favoritedStories.append($story)
    }
  }
  $favoritedStories.show();
}

async function deleteStory(evt) {
  console.debug("deleteStory", evt);
  const $closestLi = $(evt.target).closest("li")
  const storyId = $closestLi.attr("id")

  await storyList.removeStory(currentUser, storyId)

  await putUserStoriesOnPage();
}

$ownStories.on("click", ".trash-can", deleteStory)

async function toggleStoryFavorite(evt) {
  console.debug("togglestoryfavorite")

  const $tgt = $(evt.target);
  const $closestLi = $tgt.closest("li")
  const storyId = $closestLi.attr("id")
  const story = storyList.stories.find(s => s.storyId === storyId)

  //add and remove favorites
  if ($tgt.hasClass("fas")) {
    await currentUser.removeFavorite(story)
    $tgt.closest("i").toggleClass("fas far")
    // needs to happen on the models/API side
    //1) Remove story from users favorites array
    //2) Remove story from users favorited stories on API site 
  } else {
    await currentUser.addFavorite(story)
    $tgt.closest("i").toggleClass("fas far")
  }
}

$storiesList.on("click", ".star", toggleStoryFavorite)
