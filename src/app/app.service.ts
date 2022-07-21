import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastId } from 'primeng/utils/uniquecomponentid';
import { BehaviorSubject, combineLatest, EMPTY, Subject } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { environment } from "../environments/environment"

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  address?: {
    street?: string;
    suite?: string;
    city?: string;
    zipcode?: string;
    geo?: {
      lat?: string;
      lng?: string;
    };
  };
  phone?: string;
  website: string;
  company?: {
    name?: string;
    catchPhrase?: string;
    bs?: string;
  };
}

const apiEndpoint = '';

@Injectable()
export class AppService {

  constructor(private http: HttpClient) {}
  deletedUsers: User[] = [];
  newUsers: User[] = [];

  allUsers$ = this.http.get<User[]>(environment.apiUrl);
  private deletedUsersSubject = new BehaviorSubject<User[]>([]);
  deletedUsers$ = this.deletedUsersSubject.asObservable();

  private addedUsersSubject = new BehaviorSubject<User[]>([]);
  addedUsers$ = this.addedUsersSubject.asObservable();

  allUsersWithDeletion$ = combineLatest([
    this.allUsers$,
    this.deletedUsers$,
  ]).pipe(
    map(([users, deletedUsers]) =>
      deletedUsers.length > 0
        ? users.filter(
            (user) => deletedUsers.findIndex((u) => u.id === user.id) === -1
          )
        : users
    ),
    tap((users) => console.log(users))
  );

  allUsersWithDeletionAndAddition$ = combineLatest([
    this.allUsers$,
    this.deletedUsers$,
    this.addedUsers$,
  ]).pipe(
    map(([users, deletedUsers, addedUsers]) => [
      [...users, ...addedUsers],
      deletedUsers,
    ]),
    map(([users, deletedUsers]) =>
      deletedUsers.length > 0
        ? users.filter(
            (user) => deletedUsers.findIndex((u) => u.id === user.id) === -1
          )
        : users
    ),
    tap((users) => console.log(users))
  );

  deleteUser(users: User[]) {
    this.deletedUsers = [...this.deletedUsers, ...users];
    this.deletedUsersSubject.next(this.deletedUsers);

    //Call Api to persist
  }

  addUser(user: User) {
    this.newUsers = [...this.newUsers, user];
    this.addedUsersSubject.next(this.newUsers);

    //Call Api to persist
  }

  generateUniqueId() {
    return this.allUsersWithDeletionAndAddition$.pipe(
      map((users) => users.sort((a, b) => b.id - a.id)),
      take(1),
      map((user) => user[0].id)
    );
  }
}
