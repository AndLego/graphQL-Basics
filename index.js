import { ApolloServer, gql, UserInputError } from "apollo-server";
import "./db.js";
import Person from "./models/person.js";

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

  type Query {
    personCount: Int!
    allPersons(phone: YesNo): [Person]!
    findPerson(name: String!): Person
  }

  type Mutation {
    addPerson(
      name: String!
      phone: String
      street: String!
      city: String!
    ): Person
    editNumber(name: String!, phone: String!): Person
  }
`;

//ahora hay que crear como se resuelve este informacion

const resolvers = {
  Query: {
    personCount: () => Person.collection.countDocuments(),
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
  },
  Mutation: {
    addPerson: async (root, args) => {
      const person = new Person({ ...args });
      try {
        await person.save();
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
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
