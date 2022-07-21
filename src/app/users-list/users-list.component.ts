import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { MessageService } from 'primeng/api';
import { BehaviorSubject, combineLatest, EMPTY, Observable } from 'rxjs';
import { catchError, debounceTime, map, switchMap, tap } from 'rxjs/operators';
import { AppService, User } from '../app.service';

@Component({
  selector: 'users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css'],
})
export class UsersListComponent {
  searchString: string = '';
  private searchSubject = new BehaviorSubject<string>('');
  searchAction$ = this.searchSubject.asObservable();

  filteredUsers$ = this.searchAction$.pipe(
    debounceTime(300),
    switchMap((searchString) =>
      this.appService.allUsersWithDeletionAndAddition$.pipe(
        map((users) =>
          users.filter((user) =>
            user && user.name
              ? user.name.toLowerCase().includes(searchString.toLowerCase())
              : true
          )
        )
      )
    )
  );
  addUserForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    username: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    website: new FormControl('', [Validators.required]),
  });
  addUserDialog: boolean = false;
  selectedUsers: User[] = [];
  totalDeleteCount: number = 0;

  constructor(
    private appService: AppService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  get isDeleteDisable() {
    return this.selectedUsers
      ? this.totalDeleteCount === this.selectedUsers.length
      : true;
  }

  deleteUser() {
    if (this.selectedUsers.length > 0) {
      this.confirmationService.confirm({
        message: 'Are you sure you want to delete the user(s)?',
        header: 'Confirm',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.appService.deleteUser(this.selectedUsers);
          this.totalDeleteCount = this.selectedUsers.length;
          this.messageService.add({
            severity: 'success',
            summary: 'Successful',
            detail: 'User Deleted',
            life: 3000,
          });
        },
      });
    }
  }

  newUser() {
    this.addUserDialog = true;
  }

  hideDialog() {
    this.addUserForm.reset();
    this.addUserDialog = false;
  }

  async addUser() {
    let formData = this.addUserForm.value;
    let newId: number = 100;
    await this.appService
      .generateUniqueId()
      .toPromise()
      .then((data) => (data ? (newId = data + 1) : 100));
    let newUser: User = {
      id: newId,
      name: formData.name as string,
      username: formData.username as string,
      email: formData.email as string,
      website: formData.website as string,
    };
    this.appService.addUser(newUser);
    this.hideDialog();
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'User Added',
      life: 3000,
    });
  }

  triggerSearch(ev: any) {
    console.log('asdsa');
    this.searchSubject.next(ev.target.value);
  }
}
