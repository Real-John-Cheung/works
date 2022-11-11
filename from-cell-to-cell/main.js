showAbout = function () {
    document.getElementById("shadow").classList.remove("hidden");
    document.getElementById("about").classList.remove("hidden");
    document.getElementById("infoIcon").classList.add("hidden");
}

hideAbout = function () {
    document.getElementById("shadow").classList.add("hidden");
    document.getElementById("about").classList.add("hidden");
    document.getElementById("infoIcon").classList.remove("hidden");

}