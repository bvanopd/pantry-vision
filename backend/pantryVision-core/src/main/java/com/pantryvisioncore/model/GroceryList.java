package com.pantryvisioncore.model;

import jakarta.persistence.*;

@Entity
@Table(name = "grocery_list")
public class GroceryList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long groceryListId;

    @Column(name = "grocery_list_title")
    private String groceryListTitle;

    @Column(name = "grocery_list_ingredients", length = 65555)
    private String groceryListIngredients;

    @ManyToOne
    @JoinColumn(name = "grocery_list_user_id", nullable = false)
    // @JoinColumn(name = "grocery_list_user_id", nullable = false)
    private User getUserId() {
      return null;
    };

    public GroceryList() {
    }

    public GroceryList(String title, String firstIngredientId) {
        super();
        this.groceryListTitle = title;
        this.groceryListIngredients = firstIngredientId;
    }


    public long getId() {
        return this.groceryListId;
    }

    public void setId(long id) {
        this.groceryListId = id;
    }

    public String getGroceryListTitle() {
        return this.groceryListTitle;
    }

    public void setGroceryListTitle(String groceryListTitle) {
        this.groceryListTitle = groceryListTitle;
    }

    public String getGroceryListItems() { return this.groceryListIngredients; }
}