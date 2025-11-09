
var selector = document.querySelector(".selector_box");
selector.addEventListener('click', () => {
    if (selector.classList.contains("selector_open")){
        selector.classList.remove("selector_open")
    }else{
        selector.classList.add("selector_open")
    }
})

document.querySelectorAll(".date_input").forEach((element) => {
    element.addEventListener('click', () => {
        document.querySelector(".date").classList.remove("error_shown")
    })
})

var sex = "m"

document.querySelectorAll(".selector_option").forEach((option) => {
    option.addEventListener('click', () => {
        sex = option.id;
        document.querySelector(".selected_text").innerHTML = option.innerHTML;
    })
})

var upload = document.querySelector(".upload");

var imageInput = document.createElement("input");
imageInput.type = "file";
imageInput.accept = ".jpeg,.png,.gif";

document.querySelectorAll(".input_holder").forEach((element) => {

    var input = element.querySelector(".input");
    input.addEventListener('click', () => {
        element.classList.remove("error_shown");
    })

});

upload.addEventListener('click', () => {
    imageInput.click();
    upload.classList.remove("error_shown")
});

// Funkcja do kompresji obrazu
function compressImage(dataUrl, callback) {
    var img = new Image();
    img.onload = function() {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        
        // Maksymalna szerokość/wysokość
        var maxWidth = 800;
        var maxHeight = 800;
        
        var width = img.width;
        var height = img.height;
        
        // Oblicz nowe wymiary zachowując proporcje
        if (width > height) {
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
        } else {
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Narysuj obraz na canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Konwertuj na data URL z kompresją JPEG (jakość 0.7)
        var compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        callback(compressedDataUrl);
    };
    img.onerror = function() {
        // Jeśli kompresja się nie powiodła, użyj oryginalnego obrazu
        callback(dataUrl);
    };
    img.src = dataUrl;
}

imageInput.addEventListener('change', (event) => {

    upload.classList.remove("upload_loaded");
    upload.classList.add("upload_loading");

    upload.removeAttribute("selected")

    var file = imageInput.files[0];
    
    if (!file) {
        upload.classList.remove("upload_loading");
        return;
    }

    // Sprawdź rozmiar pliku (max 10MB dla bezpieczeństwa)
    if (file.size > 10 * 1024 * 1024) {
        upload.classList.remove("upload_loading");
        upload.classList.add("error_shown");
        return;
    }

    // Timeout na wypadek gdyby FileReader się zawiesił
    var timeoutId = setTimeout(function() {
        if (upload.classList.contains("upload_loading")) {
            upload.classList.remove("upload_loading");
            upload.classList.add("error_shown");
        }
    }, 15000); // 15 sekund timeout

    // Użyj FileReader - działa lokalnie bez potrzeby serwera
    var reader = new FileReader();
    
    var isCompleted = false;
    
    reader.onload = function(e) {
        if (isCompleted) return;
        isCompleted = true;
        clearTimeout(timeoutId);
        
        try {
            var url = e.target.result;
            
            // Kompresuj obraz jeśli jest za duży (max 1MB dla localStorage)
            if (url.length > 1000000) {
                // Kompresja jest w toku - stan loading pozostaje
                compressImage(url, function(compressedUrl) {
                    upload.classList.remove("error_shown");
                    upload.setAttribute("selected", compressedUrl);
                    upload.classList.add("upload_loaded");
                    upload.classList.remove("upload_loading");
                    
                    var imgElement = upload.querySelector(".upload_uploaded");
                    if (imgElement) {
                        imgElement.src = compressedUrl;
                    }
                });
            } else {
                upload.classList.remove("error_shown");
                upload.setAttribute("selected", url);
                upload.classList.add("upload_loaded");
                upload.classList.remove("upload_loading");
                
                var imgElement = upload.querySelector(".upload_uploaded");
                if (imgElement) {
                    imgElement.src = url;
                }
            }
        } catch (error) {
            upload.classList.remove("upload_loading");
            upload.classList.add("error_shown");
        }
    };
    
    reader.onerror = function() {
        if (isCompleted) return;
        isCompleted = true;
        clearTimeout(timeoutId);
        upload.classList.remove("upload_loading");
        upload.classList.add("error_shown");
    };
    
    reader.onabort = function() {
        if (isCompleted) return;
        isCompleted = true;
        clearTimeout(timeoutId);
        upload.classList.remove("upload_loading");
    };
    
    // Przeczytaj plik jako data URL (działa lokalnie)
    try {
        reader.readAsDataURL(file);
    } catch (error) {
        clearTimeout(timeoutId);
        upload.classList.remove("upload_loading");
        upload.classList.add("error_shown");
    }

})

document.querySelector(".go").addEventListener('click', () => {

    var empty = [];

    var params = new URLSearchParams();

    params.set("sex", sex)
    if (!upload.hasAttribute("selected")){
        empty.push(upload);
        upload.classList.add("error_shown")
    }else{
        // Zapisz obraz w localStorage zamiast przekazywać przez URL (URL jest za długi)
        var imageUrl = upload.getAttribute("selected");
        try {
            localStorage.setItem("userImage", imageUrl);
        } catch (e) {
            // Jeśli localStorage jest pełny, spróbuj zmniejszyć rozmiar obrazu
            console.error("Błąd zapisu do localStorage:", e);
            // Fallback: użyj tylko pierwszych 100KB obrazu (jeśli to możliwe)
            if (imageUrl.length > 100000) {
                empty.push(upload);
                upload.classList.add("error_shown");
                alert("Obraz jest zbyt duży. Proszę wybrać mniejsze zdjęcie.");
                return;
            }
        }
    }

    var birthday = "";
    var dateEmpty = false;
    document.querySelectorAll(".date_input").forEach((element) => {
        birthday = birthday + "." + element.value
        if (isEmpty(element.value)){
            dateEmpty = true;
        }
    })

    birthday = birthday.substring(1);

    if (dateEmpty){
        var dateElement = document.querySelector(".date");
        dateElement.classList.add("error_shown");
        empty.push(dateElement);
    }else{
        params.set("birthday", birthday)
    }

    document.querySelectorAll(".input_holder").forEach((element) => {

        var input = element.querySelector(".input");

        if (isEmpty(input.value)){
            empty.push(element);
            element.classList.add("error_shown");
        }else{
            params.set(input.id, input.value)
        }

    })

    if (empty.length != 0){
        empty[0].scrollIntoView();
    }else{

        forwardToId(params);
    }

});

function isEmpty(value){

    let pattern = /^\s*$/
    return pattern.test(value);

}

function forwardToId(params){

    location.href = "id.html?" + params

}

var guide = document.querySelector(".guide_holder");
guide.addEventListener('click', () => {

    if (guide.classList.contains("unfolded")){
        guide.classList.remove("unfolded");
    }else{
        guide.classList.add("unfolded");
    }

})

document.querySelectorAll(".input").forEach((input) => {
    input.value = localStorage.getItem(input.id) || "";
    input.addEventListener("input", () => {
        localStorage.setItem(input.id, input.value);
    });
});


