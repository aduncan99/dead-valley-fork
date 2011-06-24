// Inventory Display
define(['game', 'Inventory'], function (game, Inventory) {

  var draggingItem, draggingItemOriginalPos, draggingItemOriginalInv;

  // magic number!
  // a single block is 44x44 but some extra crap is put in there
  var cellSize = 50;

  var findCellPosition = function (cell) {
    // TODO nicer way of finding this?
    return {
      x: cell.prevAll().length,
      y: cell.parent().prevAll().length
    }
  };

  // dropping anywhere else reverts the drag
  $('body').droppable().bind('drop' ,function () {
    draggingItemOriginalInv.addItem(draggingItem,
                                    draggingItemOriginalPos.x,
                                    draggingItemOriginalPos.y);
    draggingItem = null;
    draggingItemOriginalPos = null;
    draggingItemOriginalInv = null;
  });

  var InventoryDisplay = function (inventory, parent) {
    this.inventory = inventory;
    this.parent = parent;

    this.createTable();

    this.updateTable();
    this.setupEventHandlers();
  };

  InventoryDisplay.prototype = {

    itemEventHandlers: {
      dragstart: function (event, ui) {
        var image = $(event.target);
        draggingItem = image.data('item');
        draggingItemOriginalPos = {
          x: draggingItem.x,
          y: draggingItem.y
        };
        draggingItemOriginalInv = this.inventory;
        this.inventory.removeItem(draggingItem);
      }
    },

    tableEventHandlers: {
      drop: function (event, ui) {
        var tablePos = $(this.table).offset();
        var posX = Math.round((ui.offset.left - tablePos.left) / cellSize);
        var posY = Math.round((ui.offset.top - tablePos.top) / cellSize);
        if (this.inventory.isAvailable(draggingItem, posX, posY)) {
          this.inventory.addItem(draggingItem, posX, posY);
        } else {
          // put it back where it was
          draggingItemOriginalInv.addItem(draggingItem,
                                          draggingItemOriginalPos.x,
                                          draggingItemOriginalPos.y);
        }
        draggingItem = null;
        draggingItemOriginalPos = null;
        draggingItemOriginalInv = null;
        return false;
      }
    },

    setupEventHandlers: function () {
      var self = this;

      this.inventory.subscribe('itemAdded', $.proxy(this.renderItem, this));

      this.inventory.subscribe('itemRemoved', $.proxy(this.removeItem, this));

      _.each(this.tableEventHandlers, function (handler, key) {
        self.table.bind(key, $.proxy(handler, self));
      });

      var body = $('body');
      _.each(this.bodyEventHandlers, function (handler, key) {
        cells.bind(key, $.proxy(handler, self));
      });
    },

    setupItemEventHandlers: function (itemNode) {
      var self = this;
      _.each(this.itemEventHandlers, function (handler, key) {
        itemNode.bind(key, $.proxy(handler, self));
      });
    },

    createTable: function () {
      var i, j, row, td;
      var rowCount = this.inventory.height;
      var colCount = this.inventory.width;
      var table = $("<table/>").addClass("inventory");
      for (i = 0; i < rowCount; i++) {
        row = $("<tr/>");
        for (j = 0; j < colCount; j++) {
          td = $("<td/>");
          row.append(td);
        }
        table.append(row);
      }

      table.droppable({
        greedy:    true,
        tolerance: 'touch'
      });
      this.parent.append(table);
      this.table = table;
    },

    renderItem: function (item) {
      var start = this.table.find("tr:eq("+item.y+") td:eq("+item.x+")");
      var pos = start.position();
      var image = $("<img/>").attr('src', item.image).addClass('inventory-item');
      image.css({left:pos.left, top:pos.top});
      image.draggable({
        helper:      'clone',
        appendTo:    'body',
        containment: 'body',
        scroll:      false
      });
      image.data('item', item);
      this.setupItemEventHandlers(image);
      start.append(image);
    },

    removeItem: function (item) {
      var x = item.x;
      var y = item.y;
      var start = this.table.find("tr:eq("+y+") td:eq("+x+")");
      start.empty();
    },

    updateTable: function () {
      _.each(this.inventory.items, function (item) {
        this.renderItem(item);
      }, this);
    }
  };

  return InventoryDisplay;
});
