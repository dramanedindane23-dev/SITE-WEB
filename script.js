let clickCount = 0;

// PRIX FIXES - NON MODIFIABLES PAR LE PROPRIÉTAIRE
const FIXED_PRICES = Object.freeze({
    pizza: Object.freeze({
        small: 5,
        medium: 8,
        large: 11
    }),
    extras: Object.freeze({
        'Fromage supplémentaire': 1.5,
        'Olives': 0.8,
        'Champignons': 0.8
    }),
    delivery: Object.freeze({
        fee: 2.5
    })
});

const button = document.getElementById('button');
if (button) {
    button.addEventListener('click', function() {
        clickCount++;
        document.getElementById('message').textContent = 'Vous avez cliqué sur le bouton !';
        document.getElementById('counter').textContent = 'Clics : ' + clickCount;
    });
}

const cart = [];

const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.getElementById('nav-links');
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') navLinks.classList.remove('open');
    });
}

// ===== SYSTÈME DE PAIEMENT SÉCURISÉ =====

// Algorithme Luhn pour la validation de carte
function luhnCheck(num) {
    let sum = 0;
    let isEven = false;
    for (let i = num.length - 1; i >= 0; i--) {
        let digit = parseInt(num[i], 10);
        if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        isEven = !isEven;
    }
    return sum % 10 === 0;
}

// Formatter numero de carte
function formatCardNumber(value) {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
}

// Formatter expiration MM/AA
function formatExpiry(value) {
    let v = value.replace(/\s+/g, '').replace(/[^\d]/gi, '');
    if (v.length >= 2) {
        v = v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
}

// Validation de la carte
function validateCard() {
    const holder = document.getElementById('card-holder').value.trim();
    const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
    const expiry = document.getElementById('card-expiry').value;
    const cvc = document.getElementById('card-cvc').value;

    const validationDiv = document.getElementById('card-validation');
    let isValid = true;
    let message = '';

    // Vérifier le titulaire
    if (holder.length < 3) {
        isValid = false;
        message = '⚠️ Veuillez entrer un nom valide';
    }

    // Vérifier le numéro de carte
    if (cardNumber.length !== 16 || !luhnCheck(cardNumber)) {
        isValid = false;
        message = '❌ Numéro de carte invalide';
    }

    // Vérifier l'expiration
    const expiryParts = expiry.split('/');
    if (expiryParts.length !== 2) {
        isValid = false;
        message = '❌ Format d\'expiration invalide';
    } else {
        const month = parseInt(expiryParts[0], 10);
        const year = parseInt('20' + expiryParts[1], 10);
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        if (month < 1 || month > 12 || year < currentYear || (year === currentYear && month < currentMonth)) {
            isValid = false;
            message = '❌ Carte expirée';
        }
    }

    // Vérifier le CVC
    if (cvc.length !== 3 && cvc.length !== 4) {
        isValid = false;
        message = '❌ CVC invalide';
    }

    if (isValid) {
        validationDiv.className = 'card-validation valid';
        validationDiv.innerHTML = '<i class="fas fa-check-circle"></i> Carte valide';
        validationDiv.style.display = 'block';
    } else {
        validationDiv.className = 'card-validation invalid';
        validationDiv.innerHTML = `<i class="fas fa-times-circle"></i> ${message}`;
        validationDiv.style.display = 'block';
    }

    return isValid;
}

let generatedOTP = '';
let otpExpiresAt = 0;

// Générer OTP
function generateOTP() {
    generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    otpExpiresAt = Date.now() + 300000; // 5 minutes
    console.log('OTP généré (démo) :', generatedOTP); // Pour test
    startOTPTimer();
    return generatedOTP;
}

// Démarrer le compte à rebours OTP
function startOTPTimer() {
    const timerEl = document.getElementById('otp-timer');
    const verifyBtn = document.getElementById('verify-otp-btn');

    const updateTimer = () => {
        const remaining = Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000));
        timerEl.textContent = remaining;

        if (remaining <= 0) {
            verifyBtn.disabled = true;
            timerEl.textContent = '0';
        } else {
            setTimeout(updateTimer, 1000);
        }
    };

    updateTimer();
}

// Vérifier OTP
function verifyOTP() {
    const otpInput = document.getElementById('otp-code').value;

    if (otpInput !== generatedOTP) {
        alert('❌ Code OTP incorrect');
        return false;
    }

    if (Date.now() > otpExpiresAt) {
        alert('❌ Code OTP expiré');
        return false;
    }

    return true;
}

// Initialiser les événements du paiement
function initPaymentSystem() {
    const paymentModal = document.getElementById('payment-modal');
    const checkoutBtn = document.getElementById('checkout-btn');
    const closeBtn = document.querySelector('.close-payment-modal');
    const paymentForm = document.getElementById('payment-form');
    const cardNumberInput = document.getElementById('card-number');
    const cardExpiryInput = document.getElementById('card-expiry');
    const cardCVCInput = document.getElementById('card-cvc');
    const payBtn = document.getElementById('pay-btn');
    const verifyOTPBtn = document.getElementById('verify-otp-btn');

    // Ouverture du modal
    checkoutBtn.addEventListener('click', function() {
        if (cart.length === 0) {
            alert('Votre panier est vide');
            return;
        }

        const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
        const deliveryMethod = document.querySelector('input[name="delivery_method"]:checked')?.value || 'pickup';
        const deliveryFee = deliveryMethod === 'delivery' ? FIXED_PRICES.delivery.fee : 0;
        const total = subtotal + deliveryFee;

        document.getElementById('payment-amount').textContent = total.toFixed(2);
        paymentModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });

    // Fermeture du modal
    closeBtn.addEventListener('click', () => {
        paymentModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    paymentModal.addEventListener('click', (e) => {
        if (e.target === paymentModal) {
            paymentModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // Formatage des champs
    cardNumberInput.addEventListener('input', (e) => {
        e.target.value = formatCardNumber(e.target.value);
    });

    cardExpiryInput.addEventListener('input', (e) => {
        e.target.value = formatExpiry(e.target.value);
    });

    // Validation en temps réel
    paymentForm.addEventListener('input', validateCard);

    // Soumission du formulaire
    paymentForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!validateCard()) {
            alert('Veuillez corriger les erreurs du formulaire');
            return;
        }

        // Afficher la section OTP
        document.getElementById('otp-section').style.display = 'block';
        paymentForm.style.display = 'none';
        generateOTP();

        // Simuler l'envoi du code (en production, envoyer par email/SMS)
        const email = document.getElementById('payment-email').value;
        console.log(`Code OTP envoyé à ${email}`);
    });

    // Vérification OTP
    verifyOTPBtn.addEventListener('click', () => {
        if (!verifyOTP()) return;

        // Paiement réussi
        const email = document.getElementById('payment-email').value;
        const totalAmount = document.getElementById('payment-amount').textContent;

        // Enregistrer la commande complète
        const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
        const deliveryMethod = document.querySelector('input[name="delivery_method"]:checked')?.value || 'pickup';
        const deliveryFee = deliveryMethod === 'delivery' ? FIXED_PRICES.delivery.fee : 0;
        const total = subtotal + deliveryFee;

        const orderItems = cart.map(item => ({ ...item }));
        const orderData = {
            id: Date.now(),
            items: orderItems,
            subtotal: subtotal,
            deliveryFee: deliveryFee,
            total: total,
            deliveryDetails: document.querySelector('input[name="delivery_method"]:checked').value === 'delivery' ? {
                method: 'delivery',
                address: document.getElementById('customer-address').value,
                phone: document.getElementById('customer-phone').value,
                time: document.getElementById('delivery-time').value
            } : {
                method: 'pickup',
                time: document.getElementById('pickup-time').value
            },
            payment: {
                email: email,
                timestamp: Date.now(),
                status: 'paid'
            },
            timestamp: Date.now(),
            status: 'confirmed'
        };

        const notifications = JSON.parse(localStorage.getItem('mr-paprika-order-notifications') || '[]');
        notifications.unshift(orderData);
        localStorage.setItem('mr-paprika-order-notifications', JSON.stringify(notifications));

        // Afficher le succès
        document.getElementById('otp-section').style.display = 'none';
        document.getElementById('payment-success').style.display = 'block';
        document.getElementById('success-email').textContent = email;

        // Réinitialiser après 3 secondes
        setTimeout(() => {
            cart.length = 0;
            renderCart();
            paymentForm.reset();
            paymentForm.style.display = 'block';
            document.getElementById('payment-success').style.display = 'none';
            document.getElementById('card-validation').style.display = 'none';
            document.getElementById('checkout-status').textContent = `✅ Paiement confirmé ! Commande #${orderData.id}`;
            document.getElementById('checkout-status').style.color = '#27ae60';
            paymentModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            updateOrderBadge();
        }, 3000);
    });
}

// Gestion des options de livraison
function initDeliveryOptions() {
    const deliveryOptions = document.querySelectorAll('input[name="delivery_method"]');
    const deliveryFields = document.getElementById('delivery-address');

    deliveryOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            if (e.target.value === 'delivery') {
                deliveryFields.style.display = 'block';
                // Rendre les champs requis
                document.getElementById('customer-address').required = true;
                document.getElementById('customer-phone').required = true;
            } else {
                deliveryFields.style.display = 'none';
                // Enlever la requirement
                document.getElementById('customer-address').required = false;
                document.getElementById('customer-phone').required = false;
            }
        });
    });
}

initDeliveryOptions();
initPaymentSystem();

function renderCart() {
    const cartItems = document.getElementById('cart-items');
    const checkoutStatus = document.getElementById('checkout-status');
    if (!cartItems || !checkoutStatus) return;

    cartItems.innerHTML = '';
    if (cart.length === 0) {
        cartItems.innerHTML = '<li>Le panier est vide.</li>';
        checkoutStatus.textContent = '';
        return;
    }

    let total = 0;
    cart.forEach((item, index) => {
        const li = document.createElement('li');
        li.textContent = `${item.type} - ${item.size} ${item.toppings.length > 0 ? '(' + item.toppings.join(', ') + ')' : ''} : ${item.price.toFixed(2)} FCFA`;

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Supprimer';
        removeBtn.className = 'remove-item';
        removeBtn.addEventListener('click', () => {
            cart.splice(index, 1);
            renderCart();
        });
        li.appendChild(removeBtn);
        cartItems.appendChild(li);

        total += item.price;
    });

    const totalElem = document.createElement('p');
    totalElem.textContent = `Total : ${total.toFixed(2)} FCFA`;
    cartItems.appendChild(totalElem);

    checkoutStatus.textContent = '';
}

const orderBtn = document.getElementById('order-btn');
if (orderBtn) {
    orderBtn.addEventListener('click', function() {
        const type = document.getElementById('type').value;
        const size = document.getElementById('size').value;
        const toppings = [];
        if (document.getElementById('extra-cheese').checked) toppings.push('Fromage supplémentaire');
        if (document.getElementById('olives').checked) toppings.push('Olives');
        if (document.getElementById('mushrooms').checked) toppings.push('Champignons');

        const prices = FIXED_PRICES.pizza;
        const extras = FIXED_PRICES.extras;

        let price = prices[size] || 0;
        toppings.forEach(t => { if (extras[t]) price += extras[t]; });

        const summary = `Pizza ${type.charAt(0).toUpperCase() + type.slice(1)}, Taille ${size.charAt(0).toUpperCase() + size.slice(1)}${toppings.length > 0 ? ', Suppléments : ' + toppings.join(', ') : ''} --> ${price.toFixed(2)} FCFA`;
        document.getElementById('order-summary').textContent = summary;

        cart.push({ type, size, toppings, price });
        renderCart();
    });
}

const checkoutBtn = document.getElementById('checkout-btn');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function() {
        const checkoutStatus = document.getElementById('checkout-status');
        if (cart.length === 0) {
            checkoutStatus.textContent = 'Le panier est vide, ajoutez au moins une pizza.';
            checkoutStatus.style.color = 'red';
            return;
        }

        // Récupérer les informations de livraison
        const deliveryMethod = document.querySelector('input[name="delivery_method"]:checked')?.value;
        if (!deliveryMethod) {
            checkoutStatus.textContent = 'Veuillez sélectionner un mode de livraison.';
            checkoutStatus.style.color = 'red';
            return;
        }

        let deliveryFee = 0;
        let deliveryDetails = {};

        if (deliveryMethod === 'delivery') {
            const address = document.getElementById('customer-address').value.trim();
            const phone = document.getElementById('customer-phone').value.trim();
            const time = document.getElementById('delivery-time').value;

            if (!address || !phone) {
                checkoutStatus.textContent = 'Veuillez remplir l\'adresse et le numéro de téléphone pour la livraison.';
                checkoutStatus.style.color = 'red';
                return;
            }

            deliveryFee = FIXED_PRICES.delivery.fee; // Frais de livraison fixes
            deliveryDetails = {
                method: 'delivery',
                address: address,
                phone: phone,
                time: time || 'Dès que possible'
            };
        } else {
            deliveryDetails = {
                method: 'pickup',
                time: document.getElementById('pickup-time').value || 'Dès que possible'
            };
        }

        const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
        const total = subtotal + deliveryFee;

        checkoutStatus.textContent = `Commande validée ! Total : ${total.toFixed(2)} FCFA (Sous-total: ${subtotal.toFixed(2)} FCFA${deliveryFee > 0 ? ` + Livraison: ${deliveryFee.toFixed(2)} FCFA` : ''}). Merci pour votre achat.`;
        checkoutStatus.style.color = '#4CAF50';

        const orderItems = cart.map(item => ({ ...item }));

        const orderData = {
            id: Date.now(),
            items: orderItems,
            subtotal: subtotal,
            deliveryFee: deliveryFee,
            total: total,
            deliveryDetails: deliveryDetails,
            timestamp: Date.now(),
            status: 'new'
        };

        const notifications = JSON.parse(localStorage.getItem('mr-paprika-order-notifications') || '[]');
        notifications.unshift(orderData);
        localStorage.setItem('mr-paprika-order-notifications', JSON.stringify(notifications));

        const pendingCount = notifications.length;
        localStorage.setItem('mr-paprika-order-count', pendingCount);

        cart.length = 0;
        renderCart();
        document.getElementById('order-summary').textContent = '';

        // Réinitialiser le formulaire de livraison
        document.querySelectorAll('input[name="delivery_method"]').forEach(radio => radio.checked = false);
        document.getElementById('delivery-address').style.display = 'none';
        document.getElementById('customer-address').value = '';
        document.getElementById('customer-phone').value = '';
        document.getElementById('delivery-time').value = '';
        document.getElementById('pickup-time').value = '';

        updateOrderBadge();
        showOrderSentAlert('Commande envoyée au propriétaire !');
    });
}

function showOrderSentAlert(message) {
    let existing = document.getElementById('order-alert');
    if (!existing) {
        existing = document.createElement('div');
        existing.id = 'order-alert';
        existing.style.position = 'fixed';
        existing.style.top = '70px';
        existing.style.right = '20px';
        existing.style.backgroundColor = '#4CAF50';
        existing.style.color = 'white';
        existing.style.padding = '12px 18px';
        existing.style.borderRadius = '8px';
        existing.style.zIndex = '9999';
        existing.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
        document.body.appendChild(existing);
    }
    existing.textContent = message;
    existing.style.display = 'block';
    setTimeout(() => {
        existing.style.display = 'none';
    }, 4000);
}

function updateOrderBadge() {
    const badge = document.getElementById('order-notifications-badge');
    if (!badge) return;
    const count = Number(localStorage.getItem('mr-paprika-order-count') || 0);
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-block';
    } else {
        badge.textContent = '0';
        badge.style.display = 'none';
    }
}

function loadOrderNotifications() {
    const countEl = document.getElementById('order-notification-count');
    const listEl = document.getElementById('order-notifications-list');
    if (!countEl || !listEl) return;

    const notifications = JSON.parse(localStorage.getItem('mr-paprika-order-notifications') || '[]');
    if (notifications.length === 0) {
        countEl.textContent = 'Aucune nouvelle commande.';
        listEl.innerHTML = '';
        return;
    }

    countEl.textContent = `Il y a ${notifications.length} nouvelle(s) commande(s).`;
    listEl.innerHTML = '';
    notifications.forEach(order => {
        const li = document.createElement('li');
        li.textContent = `${new Date(order.timestamp).toLocaleString()} — Total ${order.total.toFixed(2)} FCFA`;
        listEl.appendChild(li);
    });
}

const clearOrderNotifications = document.getElementById('clear-order-notifications');
if (clearOrderNotifications) {
    clearOrderNotifications.addEventListener('click', function() {
        localStorage.removeItem('mr-paprika-order-notifications');
        localStorage.setItem('mr-paprika-order-count', 0);
        updateOrderBadge();
        loadOrderNotifications();
    });
}

updateOrderBadge();
loadOrderNotifications();

renderCart();

const pizzaData = [
    {
        id: 'margherita',
        name: 'Margherita',
        description: 'Sauce tomate, mozzarella fondante, basilic frais',
        image: 'https://images.unsplash.com/photo-1601924582975-4d2f6f1f63a2?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: 'pepperoni',
        name: 'Pepperoni',
        description: 'Tomate, mozzarella, pepperoni croustillant',
        image: 'https://images.unsplash.com/photo-1548365328-9a5aab8b2ae3?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: 'vegetarienne',
        name: 'Végétarienne',
        description: 'Tomate, mozzarella, légumes colorés, champignons',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80'
    },
    {
        id: 'quatre-fromages',
        name: 'Quatre Fromages',
        description: 'Mozzarella, chèvre, bleu, emmental pour un goût unique',
        image: 'https://images.unsplash.com/photo-1585238342028-407d847dcc40?auto=format&fit=crop&w=600&q=80'
    }
];

function renderPizzaGallery() {
    const gallery = document.getElementById('pizza-gallery');
    if (!gallery) return;

    gallery.innerHTML = '';
    pizzaData.forEach(pizza => {
        const card = document.createElement('div');
        card.className = 'pizza-card';
        card.setAttribute('data-type', pizza.id);
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Sélectionner pizza ${pizza.name}`);

        card.innerHTML = `
            <img src="${pizza.image}" alt="Image de pizza ${pizza.name}">
            <div class="pizza-info">
                <h4>${pizza.name}</h4>
                <p>${pizza.description}</p>
            </div>
        `;

        card.addEventListener('click', () => {
            document.querySelectorAll('.pizza-card').forEach(c => {
                c.classList.remove('selected');
                c.setAttribute('aria-pressed', 'false');
            });
            card.classList.add('selected');
            card.setAttribute('aria-pressed', 'true');
            const typeSelect = document.getElementById('type');
            if (typeSelect) {
                typeSelect.value = pizza.id;
            }
        });

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });

        gallery.appendChild(card);
    });
}

renderPizzaGallery();

const ownerForm = document.getElementById('owner-form');
if (ownerForm) {
    const ownerStatus = document.getElementById('owner-status');

    function loadOwnerInfo() {
        const saved = localStorage.getItem('mr-paprika-owner');
        if (!saved) return;

        try {
            const data = JSON.parse(saved);
            document.getElementById('owner-name').value = data.name || '';
            document.getElementById('owner-email').value = data.email || '';
            document.getElementById('owner-phone').value = data.phone || '';
            document.getElementById('owner-address').value = data.address || '';
            document.getElementById('owner-map').value = data.map || '';
            document.getElementById('owner-whatsapp').value = data.whatsapp || '';
            document.getElementById('owner-tiktok').value = data.tiktok || '';
            document.getElementById('owner-instagram').value = data.instagram || '';
            document.getElementById('owner-facebook').value = data.facebook || '';
            ownerStatus.textContent = 'Coordonnées chargées depuis le stockage local.';
        } catch (error) {
            console.error('Erreur lecture localStorage:', error);
        }
    }

    ownerForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const ownerData = {
            name: document.getElementById('owner-name').value.trim(),
            email: document.getElementById('owner-email').value.trim(),
            phone: document.getElementById('owner-phone').value.trim(),
            address: document.getElementById('owner-address').value.trim(),
            map: document.getElementById('owner-map').value.trim(),
            whatsapp: document.getElementById('owner-whatsapp').value.trim(),
            tiktok: document.getElementById('owner-tiktok').value.trim(),
            instagram: document.getElementById('owner-instagram').value.trim(),
            facebook: document.getElementById('owner-facebook').value.trim()
        };

        localStorage.setItem('mr-paprika-owner', JSON.stringify(ownerData));
        ownerStatus.textContent = 'Coordonnées enregistrées avec succès !';
        ownerStatus.style.color = '#4CAF50';
        loadSocialLinks();
    });

    loadOwnerInfo();
}

function loadOwnerLocation() {
    const addressDisplay = document.getElementById('owner-address-display');
    const phoneDisplay = document.getElementById('owner-phone-display');
    const mapContainer = document.getElementById('map-container');
    if (!addressDisplay || !phoneDisplay) return;

    const saved = localStorage.getItem('mr-paprika-owner');
    if (!saved) return;

    try {
        const data = JSON.parse(saved);
        addressDisplay.textContent = data.address || 'Non spécifiée';
        phoneDisplay.textContent = data.phone || 'Non spécifié';

        if (mapContainer && data.map) {
            mapContainer.innerHTML = `<iframe src="${data.map}" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Carte de localisation de MR PAPRIKA"></iframe>`;
        } else if (mapContainer) {
            mapContainer.innerHTML = '';
        }
    } catch (error) {
        console.error('Erreur lecture localStorage:', error);
    }
}

loadOwnerLocation();

function loadSocialLinks() {
    const socialLinks = document.getElementById('social-links');
    if (!socialLinks) return;

    const saved = localStorage.getItem('mr-paprika-owner');
    if (!saved) return;

    try {
        const data = JSON.parse(saved);
        socialLinks.innerHTML = '';

        const links = [
            { key: 'whatsapp', name: 'WhatsApp', icon: '📱' },
            { key: 'tiktok', name: 'TikTok', icon: '🎵' },
            { key: 'instagram', name: 'Instagram', icon: '📸' },
            { key: 'facebook', name: 'Facebook', icon: '👥' }
        ];

        links.forEach(link => {
            if (data[link.key]) {
                const a = document.createElement('a');
                a.href = data[link.key];
                a.target = '_blank';
                a.className = 'social-link';
                a.textContent = link.icon + ' ' + link.name;
                socialLinks.appendChild(a);
            }
        });
    } catch (error) {
        console.error('Erreur lecture localStorage:', error);
    }
}

loadSocialLinks();

function pulseHeroText() {
    const heroText = document.querySelector('.hero h2');
    if (!heroText) return;
    heroText.animate([
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(1.02)', opacity: 0.9 },
        { transform: 'scale(1)', opacity: 1 }
    ], { duration: 1700, iterations: Infinity, easing: 'ease-in-out' });
}

pulseHeroText();

function expandCTAOnScroll() {
    const cta = document.querySelector('.cta-button');
    if (!cta) return;
    window.addEventListener('scroll', () => {
        const offset = Math.min(window.scrollY / 400, 0.12);
        cta.style.transform = `scale(${1 + offset})`;
    });
}

expandCTAOnScroll();

function loadChatMessages() {
    const chatMessages = document.getElementById('chat-messages');
    const ownerChatMessages = document.getElementById('owner-chat-messages');
    const saved = localStorage.getItem('mr-paprika-chat');
    let messages = [];
    if (saved) {
        try {
            messages = JSON.parse(saved);
        } catch (error) {
            console.error('Erreur lecture chat:', error);
        }
    }

    if (chatMessages) {
        chatMessages.innerHTML = '';
        messages.forEach(msg => {
            const div = document.createElement('div');
            div.className = 'chat-message';
            div.innerHTML = `<strong>${msg.name}:</strong> ${msg.message}`;
            if (msg.reply) {
                div.innerHTML += `<br><em>Réponse de MR PAPRIKA: ${msg.reply}</em>`;
            }
            chatMessages.appendChild(div);
        });
    }

    if (ownerChatMessages) {
        ownerChatMessages.innerHTML = '';
        messages.forEach((msg, index) => {
            const div = document.createElement('div');
            div.className = 'owner-chat-message';
            div.innerHTML = `<strong>${new Date(msg.timestamp).toLocaleString()}: ${msg.name}:</strong> ${msg.message}`;
            if (msg.reply) {
                div.innerHTML += `<br><em>Réponse: ${msg.reply}</em>`;
            } else {
                const replyForm = document.createElement('form');
                replyForm.className = 'reply-form';
                replyForm.innerHTML = `
                    <textarea placeholder="Votre réponse" required></textarea>
                    <button type="submit">Répondre</button>
                `;
                replyForm.addEventListener('submit', function(event) {
                    event.preventDefault();
                    const replyText = replyForm.querySelector('textarea').value.trim();
                    if (replyText) {
                        messages[index].reply = replyText;
                        messages[index].replyTimestamp = Date.now();
                        localStorage.setItem('mr-paprika-chat', JSON.stringify(messages));
                        loadChatMessages();
                    }
                });
                div.appendChild(replyForm);
            }
            ownerChatMessages.appendChild(div);
        });
    }
}

const chatForm = document.getElementById('chat-form');
if (chatForm) {
    chatForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const name = document.getElementById('chat-name').value.trim();
        const message = document.getElementById('chat-message').value.trim();
        if (!name || !message) return;

        const saved = localStorage.getItem('mr-paprika-chat');
        let messages = [];
        if (saved) {
            try {
                messages = JSON.parse(saved);
            } catch (error) {}
        }

        messages.push({ name, message, timestamp: Date.now() });
        localStorage.setItem('mr-paprika-chat', JSON.stringify(messages));

        document.getElementById('chat-name').value = '';
        document.getElementById('chat-message').value = '';

        loadChatMessages();
    });
}

const clearChatBtn = document.getElementById('clear-chat');
if (clearChatBtn) {
    clearChatBtn.addEventListener('click', function() {
        localStorage.removeItem('mr-paprika-chat');
        loadChatMessages();
    });
}

loadChatMessages();

function setupAccordionBehavior() {
    const sections = document.querySelectorAll('.accordion-section');
    sections.forEach(section => {
        section.addEventListener('toggle', () => {
            if (section.open) {
                sections.forEach(other => {
                    if (other !== section) other.open = false;
                });
            }
        });
    });
}

function setupSmoothAnchorScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (event) {
            const targetId = this.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);
            if (target) {
                event.preventDefault();
                // Fermer le menu mobile si ouvert
                document.getElementById('nav-links').classList.remove('open');

                // Ouvrir la section si elle est fermée
                if (target.tagName === 'DETAILS' && !target.open) {
                    target.open = true;
                }

                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                target.setAttribute('tabindex', '-1');
                target.focus({ preventScroll: true });
            }
        });
    });
}

setupAccordionBehavior();
setupSmoothAnchorScrolling();

// Ouvrir automatiquement la section menu si on arrive depuis le CTA du hero
if (window.location.hash === '#menu') {
    const menuSection = document.getElementById('menu');
    if (menuSection) {
        menuSection.open = true;
        setTimeout(() => {
            menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}