import { ApolloServer, UserInputError, gql } from "apollo-server";
import { v1 as uuid } from "uuid";
import axios from "axios";

const persons = [
  {
    age: "23",
    name: "Midudev",
    phone: "034-1234567",
    street: "Calle Frontend",
    city: "Barcelona",
    id: "3d5946550-3436-11e4-37bavcgsj",
  },
  {
    name: "Joseph",
    phone: "044-1234567",
    street: "Avenida Fullstack",
    city: "Mataro",
    id: "3d5946550-3436-11e4-334asdacas",
  },
  {
    name: "Platzi",
    street: "Pasaje Testin",
    city: "Ibiza",
    id: "3d5946550-3436-11e4-754dfvdf",
  },
];

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
    personCount: () => persons.length,
    allPersons: async (root, args) => {
      // const { data: personsFromRestApi } = await axios.get(
      //   "http://localhost:3000/persons"
      // );
      // console.log(personsFromRestApi);
      if (!args.phone) return persons;

      const byPhone = (person) =>
        args.phone === "YES" ? person.phone : !person.phone;

      return persons.filter(byPhone);
    },
    //arg - argumentos o parametros que le pasamos
    findPerson: (root, args) => {
      const { name } = args;
      return persons.find((person) => person.name === name);
    },
  },
  Mutation: {
    addPerson: (root, args) => {
      if (persons.find((p) => p.name === args.name)) {
        throw new UserInputError("nombre debe ser unico", {
          invalidArgs: args.name,
        });
      }
      //const {name, phone, street, city} = args
      const person = { ...args, id: uuid() };
      persons.push(person); //el update, en base de datos es diferente
      return person;
    },
    editNumber: (root, args) => {
      const personIndex = persons.findIndex((p) => p.name === args.name);
      if (personIndex === -1) return null;

      const person = persons[personIndex];

      const updatedPerson = { ...person, phone: args.phone };
      persons[personIndex] = updatedPerson;

      return updatedPerson;
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
