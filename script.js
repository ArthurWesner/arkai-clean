document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("canvas");

    if (canvas) {
        canvas.style.pointerEvents = "none";
        canvas.style.position = "fixed";  // Fixa o canvas no fundo
        canvas.style.zIndex = "-1";  // Garante que o canvas fique atrás de tudo

        const ctx = canvas.getContext("2d");

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        const gridSize = 20;
        const points = [];

        function createPoint(i, j) {
            const cellWidth = canvas.width / gridSize;
            const cellHeight = canvas.height / gridSize;

            return {
                x: Math.random() * cellWidth + i * cellWidth,
                y: Math.random() * cellHeight + j * cellHeight,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
            };
        }

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                points.push(createPoint(i, j));
            }
        }

        function movePoints() {
            for (let point of points) {
                point.x += point.vx;
                point.y += point.vy;

                if (point.x < 0 || point.x > canvas.width) point.vx *= -1;
                if (point.y < 0 || point.y > canvas.height) point.vy *= -1;
            }
        }

        function createConnections() {
            const connections = [];
            for (let i = 0; i < points.length; i++) {
                const nearestPoints = points
                    .map((p, j) => ({ index: j, dist: Math.hypot(points[i].x - p.x, points[i].y - p.y) }))
                    .sort((a, b) => a.dist - b.dist)
                    .slice(1, 6); // Pega os 5 mais próximos

                nearestPoints.forEach(point => connections.push([i, point.index]));
            }
            return connections;
        }

        let mouseX = 0, mouseY = 0;



        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const connections = createConnections();
            const lineColorNormal = getComputedStyle(document.documentElement).getPropertyValue('--line-color-normal').trim();
            const lineColorHover = getComputedStyle(document.documentElement).getPropertyValue('--line-color-hover').trim();

            for (const [i, j] of connections) {
                const dist1 = Math.hypot(points[i].x - mouseX, points[i].y - mouseY);
                const dist2 = Math.hypot(points[j].x - mouseX, points[j].y - mouseY);
                const alpha = Math.max(0, Math.min(1, (100 - Math.min(dist1, dist2)) / 100));

                ctx.strokeStyle = alpha > 0
                    ? lineColorHover.replace(/rgba?\(([^)]+)\)/, `rgba($1, ${alpha * 0.5 + 0.2})`)
                    : lineColorNormal;

                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(points[i].x, points[i].y);
                ctx.lineTo(points[j].x, points[j].y);
                ctx.stroke();
            }

            const pointSizeNormal = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--point-size-normal')) || 3;
            const pointSizeHover = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--point-size-hover')) || 6;

            for (let point of points) {
                const dist = Math.hypot(point.x - mouseX, point.y - mouseY);
                point.size = dist < 50 ? pointSizeHover : pointSizeNormal;

                ctx.fillStyle = dist < 50
                    ? getComputedStyle(document.documentElement).getPropertyValue('--point-color-hover')
                    : getComputedStyle(document.documentElement).getPropertyValue('--point-color-normal');

                ctx.beginPath();
                ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
                ctx.fill();
            }

            movePoints();
            requestAnimationFrame(draw);
        }

        draw();
    }

    window.addEventListener("scroll", function () {
        let scrollPosition = window.scrollY;
        let docHeight = document.documentElement.scrollHeight;
        let scrollPercentage = scrollPosition / docHeight;

        // Calcular os valores de transformação com base na rolagem
        let leftTransform = -150 + (scrollPercentage * 200);
        let rightTransform = 150 - (scrollPercentage * 200);
        let left2Transform = -150 + (scrollPercentage * 180);  // Novo cálculo para a caixa left2

        // Garantir que as caixas nunca ultrapassem o centro
        leftTransform = Math.min(leftTransform, 0);
        rightTransform = Math.max(rightTransform, 0);
        left2Transform = Math.min(left2Transform, 0);  // Garantir que a left2 não ultrapasse o centro

        // Atualizar as variáveis CSS
        document.documentElement.style.setProperty('--left-transform', '-50vw');
        document.documentElement.style.setProperty('--right-transform', '50vw');
        document.documentElement.style.setProperty('--left2-transform', '-50vw');

    });



});


// ====================
// FUNÇÃO PARA ANIMAÇÃO DE ENTRADA DAS CONTENT-BOX
// ====================
document.addEventListener("DOMContentLoaded", () => {
    window.addEventListener("scroll", () => {
        updateGradient();
        checkBoxesVisibility();
    });
    updateGradient(); // Chama ao carregar a página
    checkBoxesVisibility(); // Verifica a visibilidade das caixas no carregamento
});

// Função de interpolação linear
const lerp = (a, b, t) => a + (b - a) * t;

// Função para interpolação de cores
const interpolateColor = (colorStart, colorEnd, t) => {
    return {
        r: Math.round(lerp(colorStart.r, colorEnd.r, t)),
        g: Math.round(lerp(colorStart.g, colorEnd.g, t)),
        b: Math.round(lerp(colorStart.b, colorEnd.b, t)),
        a: lerp(colorStart.a, colorEnd.a, t)
    };
};

// Cores para a interpolação
// Lado esquerdo: Vermelho -> Rosa -> Azul
const leftColors = [
    { r: 255, g: 0, b: 0, a: 0.7 },    // Vermelho
    { r: 255, g: 20, b: 147, a: 0.7 },  // Rosa
    { r: 0, g: 0, b: 255, a: 0.7 }       // Azul
];

// Lado direito: Rosa -> Azul -> Ciano
const rightColors = [
    { r: 255, g: 20, b: 147, a: 0.7 },  // Rosa
    { r: 0, g: 0, b: 255, a: 0.7 },     // Azul
    { r: 0, g: 255, b: 255, a: 0.7 }    // Ciano
];

// Função genérica para obter a cor interpolada
function getInterpolatedColor(colors, t) {
    const segments = colors.length - 1;
    const segmentT = t * segments;
    const segmentIndex = Math.floor(segmentT);
    const localT = segmentT - segmentIndex;
    if (segmentIndex >= segments) {
        return colors[colors.length - 1];
    }
    return interpolateColor(colors[segmentIndex], colors[segmentIndex + 1], localT);
}

// Calcula o progresso da rolagem baseado na posição do bottom da última caixa
function calculateScrollProgress() {
    const rightBoxes = document.querySelectorAll('.content-box.right');
    if (!rightBoxes.length) return 0;
    const lastRightBox = rightBoxes[rightBoxes.length - 1];
    const lastRightBoxBottom = lastRightBox.getBoundingClientRect().bottom;
    const viewportHeight = window.innerHeight;

    // Quando o bottom da última caixa estiver na borda inferior, t = 0;
    // Quando o bottom estiver no topo (ou fora), t = 1.
    let t = (viewportHeight - lastRightBoxBottom) / viewportHeight;
    t = Math.min(Math.max(t, 0), 1);
    return easeInOut(t);
}

// Função de suavização (easeInOut)
function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function updateGradient() {
    const t = calculateScrollProgress();
    const leftColor = getInterpolatedColor(leftColors, t);
    const rightColor = getInterpolatedColor(rightColors, t);
    const dynamicGradient = `linear-gradient(90deg, rgba(${leftColor.r}, ${leftColor.g}, ${leftColor.b}, ${leftColor.a}), rgba(${rightColor.r}, ${rightColor.g}, ${rightColor.b}, ${rightColor.a}))`;

    // Atualiza a variável CSS utilizada pelo ::before das caixas
    document.documentElement.style.setProperty('--dynamic-gradient', dynamicGradient);
}

function checkBoxesVisibility() {
    const boxes = document.querySelectorAll('.content-box'); // Pega TODAS as caixas

    boxes.forEach(box => {
        const rect = box.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.85 && rect.bottom > 0) {
            box.classList.add('visible');
        } else {
            box.classList.remove('visible');
        }
    });
}

// Garante que a função seja executada corretamente
window.addEventListener("scroll", checkBoxesVisibility);
document.addEventListener("DOMContentLoaded", checkBoxesVisibility);






document.addEventListener("DOMContentLoaded", function () {
    const socialButtons = document.querySelectorAll(".social-button");

    socialButtons.forEach(button => {
        button.addEventListener("mouseenter", function () {
            button.classList.add('hover'); // Aumenta o padding
        });

        button.addEventListener("mouseleave", function () {
            button.classList.remove('hover'); // Restaura o padding
        });
    });
});


// Função para permitir arraste com o mouse ou toque
const scrollContainer = document.querySelector('.scroll-container');
let isDragging = false;
let startX;
let scrollLeft;

scrollContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.pageX - scrollContainer.offsetLeft;
    scrollLeft = scrollContainer.scrollLeft;
    scrollContainer.style.cursor = 'grabbing'; // Muda o cursor
    scrollContainer.style.userSelect = 'none'; // Desativa a seleção de texto
});

scrollContainer.addEventListener('mouseleave', () => {
    isDragging = false;
    scrollContainer.style.cursor = 'grab'; // Volta ao cursor original
    scrollContainer.style.userSelect = 'auto'; // Restaura a seleção de texto
});

scrollContainer.addEventListener('mouseup', () => {
    isDragging = false;
    scrollContainer.style.cursor = 'grab';
    scrollContainer.style.userSelect = 'auto'; // Restaura a seleção de texto
});

scrollContainer.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollContainer.offsetLeft;
    const walk = (x - startX) * 2; // Define a velocidade do arraste
    scrollContainer.scrollLeft = scrollLeft - walk;
});

document.addEventListener("DOMContentLoaded", function () {
    // Para dispositivos móveis (toque)
    const scrollContainer = document.querySelector('.scroll-container');
    let isDragging = false;
    let startX, scrollLeft;

    if (scrollContainer) {
        // Começa a arrastar
        scrollContainer.addEventListener('touchstart', (e) => {
            isDragging = true;
            startX = e.touches[0].pageX - scrollContainer.offsetLeft;
            scrollLeft = scrollContainer.scrollLeft;
            scrollContainer.style.cursor = 'grabbing';
            scrollContainer.style.userSelect = 'none'; // Desativa a seleção de texto
        }, { passive: true });

        // Finaliza o arrasto
        scrollContainer.addEventListener('touchend', () => {
            isDragging = false;
            scrollContainer.style.cursor = 'grab';
            scrollContainer.style.userSelect = 'auto'; // Restaura a seleção de texto
        }, { passive: true });

        // Move o conteúdo enquanto arrasta
        scrollContainer.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.touches[0].pageX - scrollContainer.offsetLeft;
            const walk = (x - startX) * 2; // Define a velocidade do arraste
            scrollContainer.scrollLeft = scrollLeft - walk;
        }, { passive: false });
    }

    // Ajusta a rolagem do container quando a página carrega
    if (scrollContainer) {
        scrollContainer.scrollLeft = 0;
    }

    // Muda a cor da barra de rolagem quando rolar a página
    let isScrolling;
    window.addEventListener("scroll", function () {
        document.documentElement.style.setProperty('--scrollbar-thumb-color', '#ff0000d4');
        clearTimeout(isScrolling);
        isScrolling = setTimeout(() => {
            document.documentElement.style.setProperty('--scrollbar-thumb-color', '#780707');
        }, 10);
    });

    // Muda a cor da barra de rolagem do container de rolagem
    let isScrollingContainer;
    if (scrollContainer) {
        scrollContainer.addEventListener("scroll", function () {
            document.documentElement.style.setProperty('--scroll-container-thumb-color', '#ff0000d4');
            clearTimeout(isScrollingContainer);
            isScrollingContainer = setTimeout(() => {
                document.documentElement.style.setProperty('--scroll-container-thumb-color', '#780707');
            }, 500);
        });
    }

    // Controla a exibição do menu ao clicar no ícone de menu
    const menuButton = document.querySelector(".social-button.Menu");
    const navMenu = document.getElementById("nav-menu");

    if (menuButton && navMenu) {
        menuButton.addEventListener("click", function (event) {
            event.preventDefault(); // Evita o comportamento padrão do link
            navMenu.classList.toggle("active"); // Alterna a classe para exibir/esconder o menu
        });
    }

    // O mesmo código de controle do menu, mas agora em um outro elemento
    const menuButtonImg = document.querySelector(".social-button.Menu img");
    if (menuButtonImg && navMenu) {
        menuButtonImg.addEventListener("click", function (event) {
            event.preventDefault(); // Evita o comportamento padrão do link
            navMenu.classList.toggle("active"); // Alterna a classe para exibir/esconder o menu
        });
    }
});




document.addEventListener("DOMContentLoaded", function () {
    const menuButton = document.querySelector(".social-button.Menu");
    const navMenu = document.getElementById("nav-menu");

    // Alterna o submenu ao clicar no botão de menu
    menuButton.addEventListener("click", function (e) {
        e.preventDefault();
        navMenu.classList.toggle("active");
    });

    // Fecha o submenu ao clicar fora dele
    document.addEventListener("click", function (e) {
        // Se o clique não foi dentro do submenu nem no botão de menu, fecha o submenu
        if (!navMenu.contains(e.target) && !menuButton.contains(e.target)) {
            navMenu.classList.remove("active");
        }
    });
});




