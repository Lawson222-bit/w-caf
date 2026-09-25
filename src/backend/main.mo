import Text "mo:core/Text";
import List "mo:core/List";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Float "mo:core/Float";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Random "mo:core/Random";



actor {
  type MenuItem = {
    name : Text;
    price : Float;
    category : ?Text;
  };

  type Transaction = {
    items : [MenuItem];
    total : Float;
    timestamp : Time.Time;
    paymentMethod : Text;
  };

  type GiftCard = {
    code : Text;
    balance : Float;
  };

  type CustomCreditCard = {
    identifier : Text;
    qrPayload : Text;
  };

  type CustomerOrder = {
    id : Nat;
    customerName : Text;
    items : [MenuItem];
    total : Float;
    timestamp : Time.Time;
    status : Text;
    paymentMethod : ?Text;
    wPayCode : ?Text;
  };

  module MenuItem {
    public func compare(item1 : MenuItem, item2 : MenuItem) : Order.Order {
      Text.compare(item1.name, item2.name);
    };

    public func compareByCategory(item1 : MenuItem, item2 : MenuItem) : Order.Order {
      switch (item1.category, item2.category) {
        case (null, null) { #equal };
        case (null, ?_) { #less };
        case (?_, null) { #greater };
        case (?cat1, ?cat2) { Text.compare(cat1, cat2) };
      };
    };
  };

  let menu = List.empty<MenuItem>();
  let transactions = List.empty<Transaction>();
  let giftCards = Map.empty<Text, GiftCard>();
  let customCreditCards = Map.empty<Text, CustomCreditCard>();
  let customerOrders = List.empty<CustomerOrder>();
  let wPayOrders = Map.empty<Text, CustomerOrder>();
  let paymentCodes = Map.empty<Text, CustomerOrder>();
  let state = { var nextOrderId = 0 };
  let rewards = { var rewardPoints : Nat = 0 };
  let cardState = { var nextCardId = 0 };
  let pairingState = { var activeCode : ?Text = null };
  let pairingSessions = Map.empty<Text, { code : Text; cartItems : [MenuItem]; cartTotal : Float; orderId : ?Nat; status : Text; timestamp : Time.Time }>();
  let pairingCodes = Map.empty<Text, { code : Text; timestamp : Time.Time; paired : Bool }>();

  type CustomerCard = {
    id : Text;
    customerId : Text;
    customerUsername : Text;
    cardName : Text;
    cardColor : Text;
    cardNumber : Text;
    expirationDate : Text;
    cvv : Text;
    balance : Float;
  };

  let customerCards = Map.empty<Text, CustomerCard>();

  type User = {
    username : Text;
    passwordHash : Text;
    var pointsBalance : Nat;
  };

  let users = Map.empty<Text, User>();

  public shared ({ caller }) func signUp(username : Text, password : Text) : async { #ok : Text; #err : Text } {
    if (users.containsKey(username)) {
      return #err("Username already taken");
    };
    let passwordHash = "wcafe_" # password;
    let newUser : User = {
      username;
      passwordHash;
      var pointsBalance = 0;
    };
    users.add(username, newUser);
    #ok("success");
  };

  public shared ({ caller }) func signIn(username : Text, password : Text) : async { #ok : Text; #err : Text } {
    let passwordHash = "wcafe_" # password;
    switch (users.get(username)) {
      case null { #err("Invalid username or password") };
      case (?user) {
        if (user.passwordHash == passwordHash) {
          #ok(username);
        } else {
          #err("Invalid username or password");
        };
      };
    };
  };

  public shared ({ caller }) func addMenuItem(name : Text, price : Float, category : ?Text) : async () {
    if (price < 0) {
      Runtime.trap("Price cannot be negative");
    };
    let newItem : MenuItem = {
      name;
      price;
      category;
    };
    menu.add(newItem);
  };

  public shared ({ caller }) func editMenuItem(index : Nat, name : Text, price : Float, category : ?Text) : async () {
    if (price < 0) {
      Runtime.trap("Price cannot be negative");
    };
    let newItem : MenuItem = {
      name;
      price;
      category;
    };
    let tempList = List.empty<MenuItem>();

    var currentIndex = 0;
    let iter = menu.values();
    var it = iter.next();
    while (it != null) {
      switch (it) {
        case (null) {};
        case (?item) {
          if (currentIndex == index) {
            tempList.add(newItem);
          } else {
            tempList.add(item);
          };
          currentIndex += 1;
        };
      };
      it := iter.next();
    };

    menu.clear();
    let newItemsIter = tempList.values();
    var newItemsIt = newItemsIter.next();
    while (newItemsIt != null) {
      switch (newItemsIt) {
        case (null) {};
        case (?item) {
          menu.add(item);
        };
      };
      newItemsIt := newItemsIter.next();
    };
  };

  public shared ({ caller }) func removeMenuItem(index : Nat) : async () {
    let tempList = List.empty<MenuItem>();

    var currentIndex = 0;
    let iter = menu.values();
    var it = iter.next();
    while (it != null) {
      switch (it) {
        case (null) {};
        case (?item) {
          if (currentIndex != index) {
            tempList.add(item);
          };
          currentIndex += 1;
        };
      };
      it := iter.next();
    };

    menu.clear();
    let newItemsIter = tempList.values();
    var newItemsIt = newItemsIter.next();
    while (newItemsIt != null) {
      switch (newItemsIt) {
        case (null) {};
        case (?item) {
          menu.add(item);
        };
      };
      newItemsIt := newItemsIter.next();
    };
  };

  public query ({ caller }) func getMenu() : async [MenuItem] {
    menu.toArray().sort();
  };

  public query ({ caller }) func getMenuByCategory() : async [MenuItem] {
    menu.toArray().sort(MenuItem.compareByCategory);
  };

  public shared ({ caller }) func completeTransaction(items : [MenuItem], total : Float, paymentMethod : Text) : async () {
    let transaction : Transaction = {
      items;
      total;
      timestamp = Time.now();
      paymentMethod;
    };
    transactions.add(transaction);
  };

  public shared ({ caller }) func issueGiftCard(code : Text, balance : Float) : async () {
    if (giftCards.containsKey(code)) {
      Runtime.trap("Gift card code already exists");
    };
    let newCard : GiftCard = {
      code;
      balance;
    };
    giftCards.add(code, newCard);
  };

  public query ({ caller }) func getGiftCard(code : Text) : async GiftCard {
    switch (giftCards.get(code)) {
      case (null) { Runtime.trap("Gift card not found. ") };
      case (?card) { card };
    };
  };

  public shared ({ caller }) func useGiftCard(code : Text, amount : Float) : async () {
    switch (giftCards.get(code)) {
      case (null) { Runtime.trap("Gift card not found. ") };
      case (?card) {
        if (card.balance < amount) {
          Runtime.trap("Insufficient gift card balance");
        };
        let updatedCard : GiftCard = {
          code;
          balance = card.balance - amount;
        };
        giftCards.add(code, updatedCard);
      };
    };
  };

  public shared ({ caller }) func addCustomCreditCard(identifier : Text, qrPayload : Text) : async () {
    if (customCreditCards.containsKey(identifier)) {
      Runtime.trap("Credit card identifier already exists");
    };
    let newCard : CustomCreditCard = {
      identifier;
      qrPayload;
    };
    customCreditCards.add(identifier, newCard);
  };

  public query ({ caller }) func validateCustomCreditCard(qrPayload : Text) : async Text {
    let matchingCard = customCreditCards.toArray().find(
      func((_, card)) {
        card.qrPayload == qrPayload;
      }
    );

    switch (matchingCard) {
      case (null) { Runtime.trap("Invalid credit card") };
      case (?(_, card)) { card.identifier };
    };
  };

  public shared ({ caller }) func placeCustomerOrder(customerName : Text, items : [MenuItem], total : Float) : async Nat {
    let id = state.nextOrderId;
    state.nextOrderId += 1;
    let order : CustomerOrder = {
      id;
      customerName;
      items;
      total;
      timestamp = Time.now();
      status = "pending";
      paymentMethod = null;
      wPayCode = null;
    };
    customerOrders.add(order);
    // Award 1 point per dollar spent (floor of total)
    let points = Float.floor(total).toInt();
    if (points > 0) {
      rewards.rewardPoints += points.toNat();
    };
    id;
  };

  public query ({ caller }) func getCustomerOrders() : async [CustomerOrder] {
    customerOrders.toArray();
  };

  public shared ({ caller }) func updateOrderStatus(id : Nat, status : Text, paymentMethod : ?Text) : async () {
    customerOrders.mapInPlace(
      func(order) {
        if (order.id == id) {
          { order with status; paymentMethod };
        } else {
          order;
        };
      }
    );
    let wPayEntry = wPayOrders.toArray().find(func((_, o)) { o.id == id });
    switch (wPayEntry) {
      case (null) {};
      case (?(code, o)) {
        wPayOrders.add(code, { o with status; paymentMethod });
      };
    };
  };

  public shared ({ caller }) func createWPayOrder(customerName : Text, items : [MenuItem], total : Float) : async Text {
    let id = state.nextOrderId;
    state.nextOrderId += 1;
    let ts = Time.now();
    let raw = (id * 100003 + id + 42) % 900000;
    let codeNum = raw + 100000;
    let code = codeNum.toText();
    let order : CustomerOrder = {
      id;
      customerName;
      items;
      total;
      timestamp = ts;
      status = "pending";
      paymentMethod = ?"wpay";
      wPayCode = ?code;
    };
    customerOrders.add(order);
    wPayOrders.add(code, order);
    code;
  };

  public query ({ caller }) func lookupWPayOrder(code : Text) : async ?CustomerOrder {
    wPayOrders.get(code);
  };

  public shared ({ caller }) func markWPayOrderPaid(code : Text) : async () {
    switch (wPayOrders.get(code)) {
      case (null) { Runtime.trap("W Pay order not found") };
      case (?order) {
        let updated = { order with status = "completed" };
        wPayOrders.add(code, updated);
        customerOrders.mapInPlace(
          func(o) {
            if (o.id == order.id) { updated } else { o };
          }
        );
        // Award 1 point per dollar spent (floor of order total)
        let points = Float.floor(order.total).toInt();
        if (points > 0) {
          rewards.rewardPoints += points.toNat();
        };
      };
    };
  };

  public shared ({ caller }) func generatePaymentCode(customerName : Text, items : [MenuItem], total : Float) : async Text {
    let id = state.nextOrderId;
    state.nextOrderId += 1;
    let ts = Time.now();
    let raw = (id * 100019 + id + 99) % 900000;
    let codeNum = raw + 100000;
    let code = codeNum.toText();
    let order : CustomerOrder = {
      id;
      customerName;
      items;
      total;
      timestamp = ts;
      status = "pending";
      paymentMethod = ?"card";
      wPayCode = null;
    };
    customerOrders.add(order);
    paymentCodes.add(code, order);
    code;
  };

  public query ({ caller }) func getOrderByPaymentCode(code : Text) : async ?CustomerOrder {
    paymentCodes.get(code);
  };

  public shared ({ caller }) func markOrderPaidByCode(code : Text) : async () {
    switch (paymentCodes.get(code)) {
      case (null) { Runtime.trap("Payment code not found or already used") };
      case (?order) {
        let updated = { order with status = "completed"; paymentMethod = ?"Card Device" };
        paymentCodes.remove(code);
        customerOrders.mapInPlace(
          func(o) {
            if (o.id == order.id) { updated } else { o };
          }
        );
        // Also record as a transaction
        let transaction : Transaction = {
          items = order.items;
          total = order.total;
          timestamp = Time.now();
          paymentMethod = "Card Device";
        };
        transactions.add(transaction);
      };
    };
  };

  public query ({ caller }) func getRewardPoints(username : Text) : async Nat {
    switch (users.get(username)) {
      case (?user) { user.pointsBalance };
      case null { 0 };
    };
  };

  public shared ({ caller }) func addRewardPoints(username : Text, amount : Nat) : async () {
    switch (users.get(username)) {
      case (?user) { user.pointsBalance += amount };
      case null {};
    };
  };

  public shared ({ caller }) func redeemRewardPoints(points : Nat) : async Bool {
    if (rewards.rewardPoints < points) {
      return false;
    };
    rewards.rewardPoints -= points;
    true;
  };

  public shared ({ caller }) func redeemForGiftCard(username : Text, cardName : Text) : async { #ok : Text; #err : Text } {
    switch (users.get(username)) {
      case null { return #err("User not found") };
      case (?user) {
        if (user.pointsBalance < 500) {
          return #err("Not enough points. Need 500 points to redeem.");
        };
        user.pointsBalance -= 500;
        let ts = Time.now();
        let raw = (ts % 900000 + state.nextOrderId * 100003 + 42) % 900000;
        let codeNum = raw + 100000;
        let code = "GC" # codeNum.toText();
        let newCard : GiftCard = {
          code;
          balance = 500.0;
        };
        giftCards.add(code, newCard);
        #ok(code);
      };
    };
  };
  func pad4(n : Nat) : Text {
    let s = (n % 10000).toText();
    if (s.size() == 1) { "000" # s }
    else if (s.size() == 2) { "00" # s }
    else if (s.size() == 3) { "0" # s }
    else { s };
  };

  public shared ({ caller }) func generateCustomerCard(username : Text, password : Text, cardName : Text, cardColor : Text) : async { #ok : CustomerCard; #err : Text } {
    let passwordHash = "wcafe_" # password;
    switch (users.get(username)) {
      case null { return #err("Invalid username or password") };
      case (?user) {
        if (user.passwordHash != passwordHash) {
          return #err("Invalid username or password");
        };
        let cardId = cardState.nextCardId;
        cardState.nextCardId += 1;
        let ts = Time.now();
        let seed1 = (ts % 1_000_000_000).toNat();
        let seed2 = cardId * 1_000_003 + 37;
        let p1 = pad4(seed1 % 10000);
        let p2 = pad4((seed1 / 10000 + seed2) % 10000);
        let p3 = pad4((seed2 * 7 + seed1) % 10000);
        let p4 = pad4((seed2 * 13 + cardId + 1234) % 10000);
        let cardNumber = p1 # " " # p2 # " " # p3 # " " # p4;
        let month = cardId % 12 + 1;
        let monthStr = if (month < 10) { "0" # month.toText() } else { month.toText() };
        let year = 2027 + cardId % 3;
        let expirationDate = monthStr # "/" # year.toText();
        let cvvNum = (seed2 * 31 + seed1) % 900 + 100;
        let cvv = cvvNum.toText();
        let idText = "card_" # cardId.toText();
        let newCard : CustomerCard = {
          id = idText;
          customerId = username;
          customerUsername = username;
          cardName;
          cardColor;
          cardNumber;
          expirationDate;
          cvv;
          balance = 2000.0;
        };
        customerCards.add(idText, newCard);
        #ok(newCard);
      };
    };
  };

  public shared ({ caller }) func getCustomerCards(username : Text, password : Text) : async { #ok : [CustomerCard]; #err : Text } {
    let passwordHash = "wcafe_" # password;
    switch (users.get(username)) {
      case null { return #err("Invalid username or password") };
      case (?user) {
        if (user.passwordHash != passwordHash) {
          return #err("Invalid username or password");
        };
        let userCards = customerCards.toArray()
          .filter(func((_, card)) { card.customerId == username })
          .map(func((_, card)) { card });
        #ok(userCards);
      };
    };
  };

  public query ({ caller }) func getAllCustomerCards() : async [CustomerCard] {
    customerCards.toArray()
      .map<(Text, CustomerCard), CustomerCard>(func((_, card)) { card });
  };

  public shared ({ caller }) func addCardBalance(cardId : Text, amount : Float) : async { #ok : CustomerCard; #err : Text } {
    switch (customerCards.get(cardId)) {
      case null { #err("Card not found") };
      case (?card) {
        let updated = { card with balance = card.balance + amount };
        customerCards.add(cardId, updated);
        #ok(updated);
      };
    };
  };

  public shared ({ caller }) func deleteCustomerCard(cardId : Text) : async { #ok : (); #err : Text } {
    switch (customerCards.get(cardId)) {
      case null { #err("Card not found") };
      case (?_) {
        customerCards.remove(cardId);
        #ok(());
      };
    };
  };

  public shared ({ caller }) func payWithCustomerCard(cardId : Text, amount : Float, username : Text, password : Text) : async { #ok : CustomerCard; #err : Text } {
    let passwordHash = "wcafe_" # password;
    switch (users.get(username)) {
      case null { return #err("Invalid username or password") };
      case (?user) {
        if (user.passwordHash != passwordHash) {
          return #err("Invalid username or password");
        };
        switch (customerCards.get(cardId)) {
          case null { return #err("Card not found") };
          case (?card) {
            if (card.customerId != username) {
              return #err("Card does not belong to this user");
            };
            if (card.balance < amount) {
              return #err("Insufficient card balance");
            };
            let updated = { card with balance = card.balance - amount };
            customerCards.add(cardId, updated);
            #ok(updated);
          };
        };
      };
    };
  };

  public shared ({ caller }) func generatePairingCode() : async Text {
    let ts = Time.now();
    let seed = (ts % 1_000_000_000).toNat();
    let raw = (seed * 10007 + seed + 77) % 9000;
    let codeNum = raw + 1000;
    let code = codeNum.toText();
    let entry = {
      code;
      timestamp = ts;
      paired = false;
    };
    pairingCodes.add(code, entry);
    pairingState.activeCode := ?code;
    // Initialize empty session for this pairing code
    pairingSessions.add(code, {
      code;
      cartItems = [];
      cartTotal = 0.0;
      orderId = null;
      status = "idle";
      timestamp = ts;
    });
    code;
  };

  public query ({ caller }) func validatePairingCode(code : Text) : async Bool {
    switch (pairingCodes.get(code)) {
      case null { false };
      case (?entry) { not entry.paired };
    };
  };

  public query ({ caller }) func getPairingStatus(code : Text) : async { #active : Bool; #notFound } {
    switch (pairingCodes.get(code)) {
      case null { #notFound };
      case (?entry) { #active(not entry.paired) };
    };
  };

  public shared ({ caller }) func markPairingCodeUsed(code : Text) : async () {
    switch (pairingCodes.get(code)) {
      case null { Runtime.trap("Pairing code not found") };
      case (?entry) {
        pairingCodes.add(code, { entry with paired = true });
      };
    };
  };

  public shared ({ caller }) func clearPairingCode(code : Text) : async () {
    pairingCodes.remove(code);
    pairingSessions.remove(code);
    switch (pairingState.activeCode) {
      case null {};
      case (?active) {
        if (active == code) {
          pairingState.activeCode := null;
        };
      };
    };
  };

  public shared ({ caller }) func updatePairingCart(code : Text, items : [MenuItem], total : Float) : async () {
    switch (pairingSessions.get(code)) {
      case null { Runtime.trap("Pairing session not found") };
      case (?session) {
        pairingSessions.add(code, { session with cartItems = items; cartTotal = total; status = "cart" });
      };
    };
  };

  public query ({ caller }) func getPairingCart(code : Text) : async ?{ items : [MenuItem]; total : Float; status : Text; orderId : ?Nat } {
    switch (pairingSessions.get(code)) {
      case null { null };
      case (?session) {
        ?{ items = session.cartItems; total = session.cartTotal; status = session.status; orderId = session.orderId };
      };
    };
  };

  public shared ({ caller }) func setPairingOrder(code : Text, orderId : Nat) : async () {
    switch (pairingSessions.get(code)) {
      case null { Runtime.trap("Pairing session not found") };
      case (?session) {
        pairingSessions.add(code, { session with orderId = ?orderId; status = "checkout" });
      };
    };
  };

  public shared ({ caller }) func activateCardDevice(code : Text, orderId : Nat) : async () {
    switch (pairingSessions.get(code)) {
      case null { Runtime.trap("Pairing session not found") };
      case (?session) {
        pairingSessions.add(code, { session with orderId = ?orderId; status = "checkout" });
      };
    };
  };

  public shared ({ caller }) func processCardDevicePayment(code : Text, cardNumber : Text, cardName : Text, expiryDate : Text, cvv : Text) : async { #ok : (); #err : Text } {
    switch (pairingSessions.get(code)) {
      case null { #err("Pairing session not found") };
      case (?session) {
        if (session.status == "paid") {
          return #err("Payment already processed for this session");
        };
        if (session.status != "checkout") {
          return #err("Session is not ready for payment");
        };
        // Validate card fields
        if (cardNumber.size() < 13) {
          return #err("Invalid card number");
        };
        if (cardName.size() == 0) {
          return #err("Cardholder name is required");
        };
        if (expiryDate.size() == 0) {
          return #err("Expiry date is required");
        };
        if (cvv.size() == 0) {
          return #err("CVV is required");
        };
        // Update session to paid and clear cart
        pairingSessions.add(code, {
          code = session.code;
          cartItems = [];
          cartTotal = 0.0;
          orderId = session.orderId;
          status = "paid";
          timestamp = session.timestamp;
        });
        // Record transaction
        let transaction : Transaction = {
          items = session.cartItems;
          total = session.cartTotal;
          timestamp = Time.now();
          paymentMethod = "Card Device";
        };
        transactions.add(transaction);
        // Mark associated order completed if present
        switch (session.orderId) {
          case null {};
          case (?id) {
            customerOrders.mapInPlace(
              func(o) {
                if (o.id == id) { { o with status = "completed"; paymentMethod = ?"Card Device" } } else { o };
              }
            );
          };
        };
        #ok(());
      };
    };
  };

  public shared ({ caller }) func markPairingPaid(code : Text) : async () {
    switch (pairingSessions.get(code)) {
      case null { Runtime.trap("Pairing session not found") };
      case (?session) {
        pairingSessions.add(code, { session with status = "paid" });
        switch (session.orderId) {
          case null {};
          case (?id) {
            customerOrders.mapInPlace(
              func(o) {
                if (o.id == id) { { o with status = "completed"; paymentMethod = ?"Card Device" } } else { o };
              }
            );
          };
        };
      };
    };
  };

  public query ({ caller }) func getDailySalesSummary() : async {
    totalRevenue : Float;
    orderCount : Nat;
    topItems : [{ name : Text; quantity : Nat }];
  } {
    let nowNs : Int = Time.now();
    // Number of nanoseconds in one day
    let dayNs : Int = 86_400_000_000_000;
    // Start of today in UTC (nanoseconds)
    let todayStart : Int = (nowNs / dayNs) * dayNs;
    let todayEnd : Int = todayStart + dayNs;

    // Accumulate item counts and revenue using a Map
    let itemCounts = Map.empty<Text, Nat>();
    var totalRevenue : Float = 0.0;
    var orderCount : Nat = 0;

    // Process direct cashier transactions
    for (tx in transactions.values()) {
      if (tx.timestamp >= todayStart and tx.timestamp < todayEnd) {
        totalRevenue += tx.total;
        orderCount += 1;
        for (item in tx.items.values()) {
          let current = switch (itemCounts.get(item.name)) {
            case (?n) { n };
            case null { 0 };
          };
          itemCounts.add(item.name, current + 1);
        };
      };
    };

    // Process completed customer orders
    for (order in customerOrders.values()) {
      if (
        order.timestamp >= todayStart and
        order.timestamp < todayEnd and
        order.status == "completed"
      ) {
        totalRevenue += order.total;
        orderCount += 1;
        for (item in order.items.values()) {
          let current = switch (itemCounts.get(item.name)) {
            case (?n) { n };
            case null { 0 };
          };
          itemCounts.add(item.name, current + 1);
        };
      };
    };

    // Convert map to array and sort by quantity descending
    let itemArray = itemCounts.toArray()
      .map(
        func((name, quantity)) { { name; quantity } }
      )
      .sort(
        func(a, b) {
          if (a.quantity > b.quantity) { #less }
          else if (a.quantity < b.quantity) { #greater }
          else { #equal };
        }
      );

    // Take top 5
    let top5 = if (itemArray.size() <= 5) {
      itemArray;
    } else {
      itemArray.sliceToArray(0, 5);
    };

    { totalRevenue; orderCount; topItems = top5 };
  };

  public shared ({ caller }) func getCustomerProfile(username : Text) : async { #ok : { orders : [CustomerOrder]; points : Nat; cards : [CustomerCard] }; #err : Text } {
    switch (users.get(username)) {
      case null { #err("User not found") };
      case (?user) {
        let orders = customerOrders.toArray()
          .filter(func(order) { order.customerName == username });
        let cards = customerCards.toArray()
          .filter(func((_, card)) { card.customerId == username })
          .map(func((_, card)) { card });
        #ok({ orders; points = user.pointsBalance; cards });
      };
    };
  };
};

