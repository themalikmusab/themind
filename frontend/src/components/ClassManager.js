export class ClassManager {
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

    const createBtn = document.createElement('button');
    createBtn.className = 'btn btn-primary';
    createBtn.textContent = '➕ Create Class';
    createBtn.onclick = () => this.showCreateModal();

    header.appendChild(title);
    header.appendChild(createBtn);

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
        <p>No classes yet. Create your first class!</p>
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

      const code = document.createElement('div');
      code.className = 'class-code mt-2';
      code.textContent = `Join Code: ${cls.join_code}`;

      const students = document.createElement('div');
      students.className = 'mt-2';
      students.style.opacity = '0.8';
      students.textContent = `👥 ${cls.student_count || 0} students`;

      classCard.appendChild(name);
      classCard.appendChild(code);
      classCard.appendChild(students);

      grid.appendChild(classCard);
    });

    content.appendChild(grid);
  }

  showCreateModal() {
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
    header.textContent = 'Create New Class';

    const form = document.createElement('form');
    form.onsubmit = (e) => this.handleCreateClass(e, modal);

    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';

    const label = document.createElement('label');
    label.className = 'form-label';
    label.textContent = 'Class Name';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-input';
    input.id = 'class-name-input';
    input.placeholder = 'e.g., Math 101, Computer Science';
    input.required = true;

    formGroup.appendChild(label);
    formGroup.appendChild(input);

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
    submitBtn.textContent = 'Create';

    buttons.appendChild(cancelBtn);
    buttons.appendChild(submitBtn);

    form.appendChild(formGroup);
    form.appendChild(buttons);

    modalContent.appendChild(header);
    modalContent.appendChild(form);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    input.focus();
  }

  async handleCreateClass(e, modal) {
    e.preventDefault();

    const name = document.getElementById('class-name-input').value;
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/classes/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      modal.remove();
      await this.loadClasses();

      // Show success notification
      this.showNotification(`✅ Class created! Join code: ${data.class.joinCode}`, 'success');
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
