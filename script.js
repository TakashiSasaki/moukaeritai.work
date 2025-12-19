document.addEventListener('DOMContentLoaded', () => {
    const text = "echo 'Welcome to moukaeritai.work'";
    const element = document.getElementById('typewriter');
    let i = 0;

    function typeWriter() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 100); // Speed of typing
        }
    }

    typeWriter();
});
