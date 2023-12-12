import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import crypto  from 'crypto';

// Описываем схему
const typeDefs = `#graphql
  type TodoList {
    """
    id записи
    """
     id: String
    
    """
    Название списка дел
    """
    name: String

    """
    Список задач
    """
    tasks: [Task]
  }

  type Task {
    """
    id записи
    """
    id: String

    """
    Текст дела
    """
    text: String

    """
    Статус дела
    """
    done: Boolean
  }

  """
  Специальный тип данных для ввода
  """
  input inputTodoList {
    id: String
    name: String
  }

  """
  Специальный тип данных для ввода
  """
  input inputTask {
    TodoListId: String
    id: String
    text: String
    done: Boolean = false
  }

  """
  Получить список всех списков дел
  """
  type Query {
    readTodoLists(filterDone: Boolean): [TodoList]
  }

  """
  Получить список дел по id списка
  """
  type Query {
    readTodoList(id:String!, filterDone:Boolean): TodoList
  }

  type Mutation {
  """
  Добавить новый список дел
  """
    createTodoList(input: inputTodoList): [TodoList] 
  """
  Удалить список дел
  """
    deleteTodoList(id: String): [TodoList]
  """
  Обновить список дел (переименовать)
  """
    updateTodoListName(input: inputTodoList): [TodoList] 
  
  """
  Добавить новую задачу в список дел
  """
    createTask(input: inputTask): TodoList

  """
  Обновить задачу в списке дел
  """
    updateTask(input: inputTask): TodoList

  """
  Удалить задачу в списке дел
  """
    deleteTask(input: inputTask): TodoList
}
`;


//пример данных, массив todoList
const _todoLists = [
  {id: "1", name: "First List",  tasks: [{id: "11", text: "A very important task!", done: false}, {id: "21", text: "to do smth...", done: false}, {id: "31", text:"test task", done: true}]},
  {id: "2", name: "Second List",  tasks: [{id: "21", text: "do Todo List App", done: false}]},
  {id: "3", name: "Delete List",  tasks: [{id: "31", text: "to delete", done: false}]}
];

// Описываем резолвер для метода просмотра
const resolvers = {
  Query: {
    readTodoLists: (_, {filterDone}) => {

      if (filterDone !== true && filterDone !== false) {
        return _todoLists;
      }
      var tmpLists = JSON.parse(JSON.stringify(_todoLists));

      tmpLists.forEach(function(item) {
        item.tasks = item.tasks.filter((task) => task.done === filterDone);
       });

      return tmpLists.filter(list => list.tasks.length !== 0)
      
    },

    readTodoList: (_, {id, filterDone}) => {
      if (filterDone !== true && filterDone !== false) {
        return _todoLists[_todoLists.findIndex(x => x.id === id)];
      }

      if (_todoLists.findIndex(x => x.id === id) == -1) {
        return null
      }

      var tmpList = JSON.parse(JSON.stringify(_todoLists[_todoLists.findIndex(x => x.id === id)]));
      tmpList.tasks = tmpList.tasks.filter(task => task.done === filterDone)
      return tmpList
      
    }
  },

  Mutation: {
    createTodoList: (_, { input }) => {
      input.id=crypto.randomBytes(8).toString("hex")
      _todoLists.push(input);
      return _todoLists;
    },
    deleteTodoList: (_, { id }) => {
      let index = _todoLists.findIndex(x => x.id === id)
      if (index != -1) {
        _todoLists.splice(index, 1);
      }
      return _todoLists;
    },
    updateTodoListName: (_, { input }) => {
      const index = _todoLists.findIndex(x => x.id === input.id);
      if (index != -1) { 
        _todoLists[index].name = input.name;
      }
      return _todoLists;
    },
    createTask: (_, { input }) => {
      input.id=crypto.randomBytes(4).toString("hex")
      let index = _todoLists.findIndex(x => x.id === input.TodoListId)
      if (index != -1) {
        //_todoLists[index].tasks.push({id: input.id, text: input.text, done: input.done});
        _todoLists[index].tasks.push(input);
      }
      return _todoLists[index];
    },
    updateTask: (_, { input }) => {
      let index = _todoLists.findIndex(x => x.id === input.TodoListId)
      if (index != -1) {
        let taskIndex = _todoLists[index].tasks.findIndex(x => x.id === input.id)
        if (taskIndex != -1) {
          _todoLists[index].tasks.splice(taskIndex, 1, input);
        }
      }
      return _todoLists[index];
    },
    deleteTask: (_, { input }) => {
      let index = _todoLists.findIndex(x => x.id === input.TodoListId)
      if (index != -1) {
        let taskIndex = _todoLists[index].tasks.findIndex(x => x.id === input.id)
        if (taskIndex != -1) {
          _todoLists[index].tasks.splice(taskIndex, 1);
        }
      }
      return _todoLists[index];
    }
  }

};

//регистрируем схему и резолверы
const server = new ApolloServer({
  typeDefs,
  resolvers
});

//создаем экземляр сервера
const HOST = process.argv[2];
const PORT = process.argv[3];
const { url } = await startStandaloneServer(server, {
  listen: { host:HOST,port: PORT },
});

console.log(`🚀  Server ready at: ${url}`);