export class StudentClassList {
  constructor(user, onSelectClass) {
    this.user = user;
    this.onSelectClass = onSelectClass;
    this.classes = [];
  }

  render() {
    const container = document.createElement('div');

    const card = document.createElement('div');
    card.className = 'card';

    const header = document.createElement('div');
    header.className = 'card-header';

    const title = document.createElement('h2');
    title.textContent = '📚 My Classes';

    const joinBtn = document.createElement('button');
    joinBtn.className = 'btn btn-primary';
    joinBtn.textContent = '➕ Join Class';
    joinBtn.onclick = () => this.showJoinModal();

    header.appendChild(title);
    header.appendChild(joinBtn);

    const content = document.createElement('div');
    content.id = 'classes-content';

    card.appendChild(header);
    card.appendChild(content);
    container.appendChild(card);

    // Load classes
    this.loadClasses();

    return container;
  }

  async loadClasses() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/classes/my-classes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      this.classes = data.classes;

      this.renderClasses();
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  }

  renderClasses() {
    const content = document.getElementById('classes-content');
    if (!content) return;

    content.innerHTML = '';

    if (this.classes.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'text-center mt-4';
      empty.style.opacity = '0.7';
      empty.innerHTML = `
        <p style="font-size: 48px; margin-bottom: 16px;">📚</p>
        <p>No classes yet. Join a class to get started!</p>
      `;
      content.appendChild(empty);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'grid grid-2';

    this.classes.forEach(cls => {
      const classCard = document.createElement('div');
      classCard.className = 'class-card';
      classCard.onclick = () => this.onSelectClass(cls);

      const name = document.createElement('div');
      name.className = 'class-name';
      name.textContent = cls.name;

      const teacher = document.createElement('div');
      teacher.className = 'mt-2';
      teacher.style.opacity = '0.8';
      teacher.textContent = `👨‍🏫 ${cls.teacher_name}`;

      const streak = document.createElement('div');
      streak.className = 'mt-2';

      if (cls.current_streak > 0) {
        streak.innerHTML = `
          <span class="streak-badge" style="font-size: 14px;">
            <span class="streak-fire">🔥</span> ${cls.current_streak}-day streak
          </span>
        `;
      } else {
        streak.style.opacity = '0.6';
        streak.textContent = '📊 No streak yet';
      }

      classCard.appendChild(name);
      classCard.appendChild(teacher);
      classCard.appendChild(streak);

      grid.appendChild(classCard);
    });

    content.appendChild(grid);
  }

  showJoinModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    };

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    const header = document.createElement('div');
    header.className = 'modal-header';
    header.textContent = 'Join Class';

    const form = document.createElement('form');
    form.onsubmit = (e) => this.handleJoinClass(e, modal);

    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';

    const label = document.createElement('label');
    label.className = 'form-label';
    label.textContent = 'Enter Class Join Code';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-input';
    input.id = 'join-code-input';
    input.placeholder = 'e.g., ABC123';
    input.required = true;
    input.style.textTransform = 'uppercase';
    input.maxLength = 6;

    formGroup.appendChild(label);
    formGroup.appendChild(input);

    const hint = document.createElement('p');
    hint.className = 'mt-2';
    hint.style.opacity = '0.7';
    hint.style.fontSize = '14px';
    hint.textContent = 'Ask your teacher for the 6-character join code';

    const buttons = document.createElement('div');
    buttons.className = 'flex gap-2 mt-4';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-secondary flex-1';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => modal.remove();

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn-primary flex-1';
    submitBtn.textContent = 'Join';

    buttons.appendChild(cancelBtn);
    buttons.appendChild(submitBtn);

    form.appendChild(formGroup);
    form.appendChild(hint);
    form.appendChild(buttons);

    modalContent.appendChild(header);
    modalContent.appendChild(form);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    input.focus();
  }

  async handleJoinClass(e, modal) {
    e.preventDefault();

    const joinCode = document.getElementById('join-code-input').value.toUpperCase();
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/classes/join', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ joinCode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      modal.remove();
      await this.loadClasses();

      // Show success notification
      this.showNotification(`✅ Joined ${data.class.name}!`, 'success');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 4000);
  }
}
