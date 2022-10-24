import {
  ApolloServer,
  AuthenticationError,
  gql,
  UserInputError,
} from "apollo-server";
import "./db.js";
import Person from "./models/person.js";
import User from "./models/user.js";
import jwt from "jsonwebtoken";

import * as dotev from "dotenv";

dotev.config();

const JWT_SECRET = process.env.JWT_SECRET;

//describir los datos de nuestro server
//con grapghql descibimos el tipo de dato y ademas describir las peticiones
//la exclamacion ! al final hace del dato obligatorio

const typeDefinitions = gql`
  enum YesNo {
    YES
    NO
  }

  type Address {
    street: String!
    city: String!
  }

  type Person {
    name: String!
    phone: String
    address: Address!
    id: ID!
  }

  type User {
    username: String!
    password: String!
    friends: [Person]!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Query {
    personCount: Int!
    allPersons(phone: YesNo): [Person]!
    findPerson(name: String!): Person
    allUser: [User]!
    me: User
  }

  type RemovePerson {
    name: String
    id: ID
  }

  type RemoveUser {
    name: String
    id: ID
  }

  type Mutation {
    addPerson(
      name: String!
      phone: String
      street: String!
      city: String!
    ): Person
    editNumber(name: String!, phone: String!): Person
    createUser(username: String!, password: String!): User!
    login(username: String!, password: String!): Token
    addAsFriend(name: String!): User
    deleteUser(name: String!): RemovePerson
    deleteAcc(name: String!): RemoveUser
  }
`;

//ahora hay que crear como se resuelve este informacion

const resolvers = {
  Query: {
    personCount: () => Person.collection.countDocuments(),
    allUser: async (root, args) => {
      return User.find({});
    },
    allPersons: async (root, args) => {
      if (!args.phone) return Person.find({});

      //revisa si args existe devuelve true
      return Person.find({ phone: { $exists: args.phone === "YES" } });
    },
    //arg - argumentos o parametros que le pasamos
    findPerson: async (root, args) => {
      const { name } = args;
      return Person.findOne({ name });
    },
    me: (root, args, context) => {
      return context.currentUser;
    },
  },
  Mutation: {
    addPerson: async (root, args, context) => {
      const { currentUser } = context;
      if (!currentUser) throw new AuthenticationError("not authenticated");

      const person = new Person({ ...args });
      try {
        await person.save();
        currentUser.friends = currentUser.friends.concat(person);
        await currentUser.save();
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      }
      return person;
    },
    editNumber: async (root, args) => {
      const person = await Person.findOne({ name: args.name });
      if (!person) return;

      person.phone = args.phone;

      try {
        await person.save();
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      }
      return person;
    },
    createUser: (root, args) => {
      const user = new User({
        ...args,
      });

      return user.save().catch((error) => {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      });
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });

      if (!user || args.password !== user.password) {
        throw new UserInputError("wrong credentials");
      }

      const userForToken = {
        username: user.username,
        password: user.password,
        id: user._id,
      };

      return {
        value: jwt.sign(userForToken, JWT_SECRET),
      };
    },
    addAsFriend: async (root, args, context) => {
      const { currentUser } = context;
      if (!currentUser) throw new AuthenticationError("not authenticated");

      const person = await Person.findOne({ name: args.name });

      const nonFriendlyAlready = (person) =>
        !currentUser.friends.map((p) => p._id).includes(person._id);

      if (nonFriendlyAlready(person)) {
        currentUser.friends = currentUser.friends.concat(person);
        await currentUser.save();
      } else {
        throw new UserInputError("already friend");
      }

      return currentUser;
    },
    deleteUser: async (root, args, context) => {
      // const { currentUser } = context;
      // if (!currentUser) throw new AuthenticationError("not authenticated");

      const person = await Person.findOne({ name: args.name });

      if (person) {
        return await Person.findByIdAndRemove(person._id);
      }

      return person;
    },
    deleteAcc: async (root, args, context) => {
      const person = await User.findOne({ name: args.name });

      if (person) {
        return await User.findByIdAndRemove(person._id);
      }

      return person;
    },
  },
  //genera datos con nuestro calculos
  Person: {
    // canDrink: (root) => root.age > 18,
    // address: (root) => `${root.street}, ${root.city}`, //combinar
    address: (root) => {
      //resolve para el tipo Address
      return {
        street: root.street,
        city: root.city,
      };
    },
  },
};

// se crea el server

const server = new ApolloServer({
  typeDefs: typeDefinitions, //o lo dejamos en typeDefs al igual que la descripcion
  resolvers,
  //context nos permite saber si un usuario esta log in
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith("bearer ")) {
      const token = auth.substring(7);
      const { id } = jwt.verify(token, JWT_SECRET);
      const currentUser = await User.findById(id).populate("friends");
      return { currentUser };
    }
  },
});

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
