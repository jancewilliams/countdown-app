class CountdownApp {
    constructor() {
        this.events = this.loadEvents();
        this.previousValues = {};
        this.dragging = null;
        this.startY = 0;
        this.startTransform = 0;
        this.itemHeight = 75;
        this.notifiedEvents = new Set();
    }

    initialize() {
        this.init();
        this.requestNotificationPermission();
        this.registerServiceWorker();
    }

    requestNotificationPermission() {
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then((registration) => {
                    console.log('Service Worker 注册成功:', registration.scope);
                })
                .catch((error) => {
                    console.log('Service Worker 注册失败:', error);
                });
        }
    }

    showNotification(event) {
        const type = event.type || 'normal';
        
        const icons = {
            urgent: '🔥',
            important: '⭐',
            normal: '⏰',
            low: '💤'
        };
        
        const overlay = document.getElementById('notificationOverlay');
        const box = document.getElementById('notificationBox');
        const icon = document.getElementById('notificationIcon');
        const eventName = document.getElementById('notificationEvent');
        
        icon.textContent = icons[type] || icons.normal;
        eventName.textContent = event.name;
        
        box.className = `notification-box ${type}`;
        overlay.classList.add('show');
        
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('倒计时结束', {
                body: event.name
            });
        }
    }
    
    closeNotification() {
        const overlay = document.getElementById('notificationOverlay');
        overlay.classList.remove('show');
    }

    init() {
        const addBtn = document.getElementById('addBtn');
        const handleAddEvent = () => this.addEvent();
        addBtn.addEventListener('click', handleAddEvent);
        addBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleAddEvent();
        });
        
        document.getElementById('eventName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addEvent();
        });
        
        this.initPresetButtons();
        this.initTypeButtons();
        this.initTimePicker();
        
        const deleteBtnHandler = (e) => {
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                e.preventDefault();
                e.stopPropagation();
                const id = parseInt(deleteBtn.dataset.id);
                this.deleteEvent(id);
            }
        };
        
        const countdownList = document.getElementById('countdownList');
        countdownList.addEventListener('click', deleteBtnHandler);
        countdownList.addEventListener('touchend', deleteBtnHandler);
        countdownList.addEventListener('touchstart', (e) => {
            if (e.target.closest('.delete-btn')) {
                e.preventDefault();
            }
        });
        
        const notificationOverlay = document.getElementById('notificationOverlay');
        const notificationBtn = document.getElementById('notificationBtn');
        
        const handleNotificationClose = (e) => {
            if (e.target === notificationOverlay || e.target === notificationBtn || e.target.closest('.notification-btn')) {
                e.preventDefault();
                this.closeNotification();
            }
        };
        
        notificationOverlay.addEventListener('click', handleNotificationClose);
        notificationOverlay.addEventListener('touchend', handleNotificationClose);
        
        this.render();
        setInterval(() => this.render(), 1000);
    }

    initTypeButtons() {
        const typeButtons = document.querySelectorAll('.type-btn');
        typeButtons.forEach(btn => {
            const selectType = (target) => {
                typeButtons.forEach(b => b.removeAttribute('selected'));
                target.setAttribute('selected', '');
            };
            
            btn.addEventListener('click', (e) => selectType(e.target));
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                selectType(e.target);
            });
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
            });
        });
    }

    getSelectedType() {
        const selectedBtn = document.querySelector('.type-btn[selected]');
        return selectedBtn ? selectedBtn.dataset.type : 'normal';
    }

    initPresetButtons() {
        const presetButtons = document.querySelectorAll('.preset-btn');
        presetButtons.forEach(btn => {
            const handleClick = (e) => {
                const target = e.target.closest('.preset-btn');
                const preset = target.dataset;
                this.setTimePickerValue({
                    days: parseInt(preset.days) || 0,
                    hours: parseInt(preset.hours) || 0,
                    minutes: parseInt(preset.minutes) || 0,
                    seconds: parseInt(preset.seconds) || 0
                });
                document.getElementById('eventName').value = preset.name || '';
            };
            
            btn.addEventListener('click', handleClick);
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleClick(e);
            });
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
            });
        });
    }

    setTimePickerValue(time) {
        const daysDrum = document.querySelector('.picker-drum[data-unit="days"]');
        const hoursDrum = document.querySelector('.picker-drum[data-unit="hours"]');
        const minutesDrum = document.querySelector('.picker-drum[data-unit="minutes"]');
        const secondsDrum = document.querySelector('.picker-drum[data-unit="seconds"]');
        
        this.setDrumValue(daysDrum, time.days);
        this.setDrumValue(hoursDrum, time.hours);
        this.setDrumValue(minutesDrum, time.minutes);
        this.setDrumValue(secondsDrum, time.seconds);
    }

    setDrumValue(drum, value) {
        drum.dataset.value = value;
        
        const items = drum.querySelectorAll('.picker-item');
        const topItemValue = parseInt(items[0].textContent);
        const bottomItemValue = parseInt(items[items.length - 1].textContent);
        
        let transformValue;
        if (topItemValue > bottomItemValue) {
            transformValue = (topItemValue - value) * this.itemHeight;
        } else {
            transformValue = value * this.itemHeight;
        }
        
        drum.style.transform = `translateY(-${transformValue}px)`;
    }

    initTimePicker() {
        const drums = document.querySelectorAll('.picker-drum');
        
        drums.forEach(drum => {
            const unit = drum.dataset.unit;
            const value = parseInt(drum.dataset.value);
            
            let maxValue;
            if (unit === 'days') maxValue = 99;
            else if (unit === 'hours') maxValue = 23;
            else maxValue = 59;
            
            const items = drum.querySelectorAll('.picker-item');
            const totalItems = items.length;
            const topItemValue = parseInt(items[0].textContent);
            const bottomItemValue = parseInt(items[totalItems - 1].textContent);
            
            let transformValue;
            if (topItemValue > bottomItemValue) {
                transformValue = (topItemValue - value) * this.itemHeight;
            } else {
                transformValue = value * this.itemHeight;
            }
            
            drum.style.transform = `translateY(-${transformValue}px)`;
            drum.dataset.maxValue = maxValue;
            
            drum.addEventListener('mousedown', (e) => this.startDrag(e, drum));
            drum.addEventListener('touchstart', (e) => this.startDrag(e.touches[0], drum), { passive: true });
            drum.addEventListener('wheel', (e) => this.onWheel(e, drum), { passive: false });
        });
        
        document.addEventListener('mousemove', (e) => this.onDrag(e));
        document.addEventListener('mouseup', () => this.stopDrag());
        document.addEventListener('touchmove', (e) => this.onDrag(e.touches[0]), { passive: true });
        document.addEventListener('touchend', () => this.stopDrag());
    }

    onWheel(e, drum) {
        if (this.dragging) return;
        
        e.preventDefault();
        
        const currentValue = parseInt(drum.dataset.value);
        const maxValue = parseInt(drum.dataset.maxValue);
        
        let newValue = currentValue;
        if (e.deltaY > 0) {
            newValue = Math.min(maxValue, currentValue + 1);
        } else {
            newValue = Math.max(0, currentValue - 1);
        }
        
        drum.dataset.value = newValue;
        
        const items = drum.querySelectorAll('.picker-item');
        const topItemValue = parseInt(items[0].textContent);
        const bottomItemValue = parseInt(items[items.length - 1].textContent);
        
        let transformValue;
        if (topItemValue > bottomItemValue) {
            transformValue = (topItemValue - newValue) * this.itemHeight;
        } else {
            transformValue = newValue * this.itemHeight;
        }
        
        drum.style.transform = `translateY(-${transformValue}px)`;
    }

    startDrag(e, drum) {
        this.dragging = drum;
        this.startY = e.clientY !== undefined ? e.clientY : (e.pageY || 0);
        const transform = drum.style.transform;
        this.startTransform = transform ? parseInt(transform.match(/-?\d+/)[0]) : 0;
        drum.style.transition = 'none';
    }

    onDrag(e) {
        if (!this.dragging) return;
        
        const clientY = e.clientY !== undefined ? e.clientY : (e.pageY || 0);
        const deltaY = clientY - this.startY;
        let newTransform = this.startTransform + deltaY;
        
        const maxValue = parseInt(this.dragging.dataset.maxValue);
        const items = this.dragging.querySelectorAll('.picker-item');
        const totalItems = items.length;
        
        const minTransform = 0;
        const maxTransform = -((totalItems - 1) * this.itemHeight);
        
        newTransform = Math.max(maxTransform, Math.min(minTransform, newTransform));
        this.dragging.style.transform = `translateY(${newTransform}px)`;
    }

    stopDrag() {
        if (!this.dragging) return;
        
        const dragging = this.dragging;
        dragging.style.transition = '';
        
        const transform = parseInt(dragging.style.transform.match(/-?\d+/)[0]);
        const maxValue = parseInt(dragging.dataset.maxValue);
        
        const items = dragging.querySelectorAll('.picker-item');
        const topItemValue = parseInt(items[0].textContent);
        const bottomItemValue = parseInt(items[items.length - 1].textContent);
        
        let snappedValue;
        if (topItemValue > bottomItemValue) {
            snappedValue = topItemValue - Math.round(Math.abs(transform) / this.itemHeight);
        } else {
            snappedValue = Math.round(Math.abs(transform) / this.itemHeight);
        }
        
        const clampedValue = Math.max(0, Math.min(maxValue, snappedValue));
        dragging.dataset.value = clampedValue;
        
        let transformValue;
        if (topItemValue > bottomItemValue) {
            transformValue = (topItemValue - clampedValue) * this.itemHeight;
        } else {
            transformValue = clampedValue * this.itemHeight;
        }
        
        dragging.style.transform = `translateY(-${transformValue}px)`;
        this.dragging = null;
    }

    getTimePickerValue() {
        const days = parseInt(document.querySelector('.picker-drum[data-unit="days"]').dataset.value) || 0;
        const hours = parseInt(document.querySelector('.picker-drum[data-unit="hours"]').dataset.value) || 0;
        const minutes = parseInt(document.querySelector('.picker-drum[data-unit="minutes"]').dataset.value) || 0;
        const seconds = parseInt(document.querySelector('.picker-drum[data-unit="seconds"]').dataset.value) || 0;
        
        return { days, hours, minutes, seconds };
    }

    resetTimePicker() {
        const drums = document.querySelectorAll('.picker-drum');
        
        drums.forEach(drum => {
            drum.dataset.value = '0';
            
            const items = drum.querySelectorAll('.picker-item');
            const topItemValue = parseInt(items[0].textContent);
            const bottomItemValue = parseInt(items[items.length - 1].textContent);
            
            let transformValue;
            if (topItemValue > bottomItemValue) {
                transformValue = topItemValue * this.itemHeight;
            } else {
                transformValue = 0;
            }
            
            drum.style.transform = `translateY(-${transformValue}px)`;
        });
    }

    addEvent() {
        const name = document.getElementById('eventName').value.trim();
        const time = this.getTimePickerValue();
        const type = this.getSelectedType();
        
        const totalSeconds = time.days * 24 * 60 * 60 + time.hours * 60 * 60 + time.minutes * 60 + time.seconds;
        
        if (!name) {
            alert('请填写事件名称');
            return;
        }
        
        if (totalSeconds === 0) {
            alert('请设置倒计时时长');
            return;
        }

        const targetDate = Date.now() + totalSeconds * 1000;
        
        const event = {
            id: Date.now(),
            name,
            targetDate,
            type,
            createdAt: Date.now()
        };

        this.events.push(event);
        this.saveEvents();
        this.clearInputs();
        this.render();
    }

    clearInputs() {
        document.getElementById('eventName').value = '';
        this.resetTimePicker();
    }

    deleteEvent(id) {
        this.events = this.events.filter(event => event.id !== id);
        this.saveEvents();
        this.render();
    }

    getTimeRemaining(targetDate) {
        const now = Date.now();
        const difference = targetDate - now;

        if (difference <= 0) {
            return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        return { expired: false, days, hours, minutes, seconds };
    }

    formatNumber(num) {
        return num.toString().padStart(2, '0');
    }

    createDrumHTML(value) {
        const digits = this.formatNumber(value);
        let html = '<div class="digits-wrapper">';
        
        for (let i = 0; i < digits.length; i++) {
            const digit = digits[i];
            const currentPos = parseInt(digit);
            const drumItems = [];
            
            for (let j = 0; j <= 9; j++) {
                drumItems.push(`<div class="drum-item">${j}</div>`);
            }
            
            html += `
                <div class="drum-container">
                    <div class="drum" style="transform: translateY(-${currentPos * 90}px);">
                        ${drumItems.join('')}
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }

    render() {
        const container = document.getElementById('countdownList');

        if (this.events.length === 0) {
            container.innerHTML = '<div class="empty-state">还没有添加任何倒计时事件</div>';
            return;
        }

        this.events.sort((a, b) => a.targetDate - b.targetDate);

        this.events.forEach(event => {
            const timeRemaining = this.getTimeRemaining(event.targetDate);
            if (timeRemaining.expired && !this.notifiedEvents.has(event.id)) {
                this.showNotification(event);
                this.notifiedEvents.add(event.id);
            }
        });

        container.innerHTML = this.events.map((event, index) => {
            const timeRemaining = this.getTimeRemaining(event.targetDate);
            const isExpired = timeRemaining.expired;
            const type = event.type || 'normal';
            
            const typeInfo = {
                urgent: { label: '🔥', class: 'urgent' },
                important: { label: '⭐', class: 'important' },
                normal: { label: '📋', class: 'normal' },
                low: { label: '💤', class: 'low' }
            }[type] || { label: '📋', class: 'normal' };

            return `
                <div class="countdown-card type-${type} ${isExpired ? 'expired' : ''}">
                    <div class="countdown-header">
                        <span class="event-name">${event.name}</span>
                        <span class="type-badge ${typeInfo.class}">${typeInfo.label}</span>
                        <button class="delete-btn" data-id="${event.id}">删除</button>
                    </div>
                    <div class="event-meta">事件${index + 1}: ${timeRemaining.days}天 ${timeRemaining.hours}时 ${timeRemaining.minutes}分 ${timeRemaining.seconds}秒</div>
                    <div class="countdown-time">
                        <div class="time-block">
                            ${this.createDrumHTML(timeRemaining.days)}
                            <div class="time-label">天</div>
                        </div>
                        <span class="divider">:</span>
                        <div class="time-block">
                            ${this.createDrumHTML(timeRemaining.hours)}
                            <div class="time-label">时</div>
                        </div>
                        <span class="divider">:</span>
                        <div class="time-block">
                            ${this.createDrumHTML(timeRemaining.minutes)}
                            <div class="time-label">分</div>
                        </div>
                        <span class="divider">:</span>
                        <div class="time-block">
                            ${this.createDrumHTML(timeRemaining.seconds)}
                            <div class="time-label">秒</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    saveEvents() {
        localStorage.setItem('countdownEvents', JSON.stringify(this.events));
    }

    loadEvents() {
        const saved = localStorage.getItem('countdownEvents');
        return saved ? JSON.parse(saved) : [];
    }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CountdownApp();
    app.initialize();
});