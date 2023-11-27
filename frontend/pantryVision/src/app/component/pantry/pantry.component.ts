import { Component } from '@angular/core';
import { Ingredient } from "../../model/ingredient";
import { Pantry } from "../../model/pantry";
import { IngredientService } from "../../service/ingredient.service";
import { firstValueFrom, lastValueFrom, take } from "rxjs";
import { AuthService } from '@auth0/auth0-angular';
import { UserService } from 'src/app/service/user.service';


@Component({
  selector: 'app-pantry',
  templateUrl: './pantry.component.html',
  styleUrls: ['./pantry.component.scss']
})
export class PantryComponent {

  public pantry: Pantry;
  plainTextToggle: Boolean = false;

  constructor(private ingredientService: IngredientService, private userService: UserService, private auth: AuthService) { }

  scheduleUpdate: boolean;
  isLoading: boolean;
  authenticated: boolean;

  ngOnInit() {
    this.initializePantry();
    this.authorizeAndLoad();
  }

  private authorizeAndLoad() {
    const loadingSub = this.auth.isLoading$.subscribe(loading => {
      this.isLoading = loading;
      if (!this.isLoading) {
        loadingSub.unsubscribe();
      }
    });
    const authSub = this.auth.isAuthenticated$.subscribe( async status => {
      this.authenticated = status;
      if (!this.isLoading && this.authenticated) {
        let pantryObj = await firstValueFrom(this.userService.getUserPantry());
        this.pantry.setAvailableIngredientsById(pantryObj.pantry);
        authSub.unsubscribe();
      }
    });
  }

  private initializePantry() {
    this.pantry = new Pantry();
    this.scheduleUpdate = false;
    this.getIngredientGroups()
      .then(complete =>
        // Add ingredients from each list to the master list of ingredients
        this.populateIngredientMasterList())
      .then(complete => {
        // Initialize the availability of each ingredient to false
        this.pantry.allIngredients.forEach(ingredient => {
          this.pantry.ingredientAvailability.set(ingredient, false);
        });
      });

    //Update pantry in DB every 20 seconds, if changes have been made (and user authenticated)
    setInterval(() => this.savePantry(), 20000);
  }

  async getIngredientGroups() {
    // TODO make sure we're handling data streams correctly
    const groups = await lastValueFrom(this.ingredientService.getIngredientGroupsFromDb());

    this.pantry.ingredientGroups = await Promise.all(groups.map(async group => {
      // TODO make a separate group for "Pantry Essentials" because they don't have a group Id
      const ingredients = await lastValueFrom(this.ingredientService.getIngredientsByGroupId(group.ingredientGroupId));

      return {
        description: group.ingredientGroupDescription,
        ingredients: ingredients.map(ingredient => {
          return new Ingredient(ingredient.ingredientName, ingredient.ingredientSpoonacularId, ingredient.ingredientGroupId, ingredient.ingredientEssentialFlg);
        })
      };
    }));
  }

  getAvailableIngredientsArray(): Ingredient[] {
    return Array.from(this.pantry.ingredientAvailability.entries())
      .filter(([ingredient, isAvailable]) => isAvailable)
      .map(([ingredient]) => ingredient);
  }

  async populateIngredientMasterList() {
    // TODO get all ungrouped ingredients and also get them in the master list
    const pantryEssentialsGroup = this.pantry.ingredientGroups.find(group => group.description === 'Pantry Essentials');
    this.pantry.ingredientGroups.forEach(group => {
      const ingredientsInGroup = group.ingredients;
      this.pantry.allIngredients.push(...ingredientsInGroup);

      // Build the essentials group here since we're iterating through all of the groups
      ingredientsInGroup.forEach(ingredient => {
        if (ingredient.ingredientEssentialFlg) {
          pantryEssentialsGroup?.ingredients.push(ingredient);
        }
      })
    });
  }

  public toggleIngredient(ingredient: Ingredient) {
    this.pantry.toggleAvailability(ingredient);
    this.scheduleUpdate = true;
  }

  public savePantry() {
    if (this.scheduleUpdate && this.authenticated) {
      this.scheduleUpdate = false;
      console.log(this.pantry.getAvailableIngredientById());
      this.userService.setUserPantry(this.pantry.getAvailableIngredientById());
    }
  }

}